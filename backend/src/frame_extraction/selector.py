"""
Frame Selector Module

Filters extracted frames to select diverse representative images.
"""

from typing import List
import numpy as np
import cv2
import logging
from skimage.metrics import structural_similarity as ssim

from .extractor import Frame


# Configure logging for frame selection module
logger = logging.getLogger('frame_extraction.selector')
logger.setLevel(logging.INFO)


class FrameSelector:
    """Selects diverse representative frames from extraction set.
    
    This class analyzes visual diversity across extracted frames using structural
    similarity (SSIM) metrics and selects a subset of representative frames that
    show the progression of a fire incident while avoiding redundant images.
    """
    
    def __init__(self, min_frames: int = 6, max_frames: int = 15,
                 similarity_threshold: float = 0.85):
        """Initialize the FrameSelector.
        
        Args:
            min_frames: Minimum number of frames to select (must be >= 1)
            max_frames: Maximum number of frames to select (must be >= min_frames)
            similarity_threshold: SSIM threshold for considering frames similar [0.0, 1.0]
                                 Frames with SSIM >= threshold are considered too similar
        
        Raises:
            ValueError: If parameters are outside valid ranges
            
        Requirements: 2.5
        """
        # Validate parameters
        if min_frames < 1:
            raise ValueError(f"min_frames must be >= 1, got {min_frames}")
        
        if max_frames < min_frames:
            raise ValueError(f"max_frames ({max_frames}) must be >= min_frames ({min_frames})")
        
        if not (0.0 <= similarity_threshold <= 1.0):
            raise ValueError(f"similarity_threshold must be between 0.0 and 1.0, got {similarity_threshold}")
        
        # Configuration
        self.min_frames = min_frames
        self.max_frames = max_frames
        self.similarity_threshold = similarity_threshold
        
        logger.info(f"FrameSelector initialized: min_frames={min_frames}, max_frames={max_frames}, "
                   f"similarity_threshold={similarity_threshold}")
    
    def compute_similarity(self, frame1: Frame, frame2: Frame) -> float:
        """Computes structural similarity between two frames.
        
        Uses SSIM (Structural Similarity Index) on grayscale images to measure
        visual similarity. SSIM considers luminance, contrast, and structure,
        making it more robust than pixel-wise comparison.
        
        If SSIM computation fails (e.g., due to image size mismatch or corruption),
        falls back to histogram-based similarity comparison.
        
        Args:
            frame1: First frame to compare
            frame2: Second frame to compare
        
        Returns:
            Similarity score in [0.0, 1.0] where 1.0 means identical frames
            
        Requirements: 2.2, 2.4
        """
        try:
            # Convert frames to grayscale for SSIM computation
            gray1 = cv2.cvtColor(frame1.image, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(frame2.image, cv2.COLOR_BGR2GRAY)
            
            # Ensure frames have the same dimensions
            if gray1.shape != gray2.shape:
                logger.warning(f"Frame shape mismatch: {gray1.shape} vs {gray2.shape}, resizing to common size")
                # Resize to the smaller dimensions to avoid information loss
                min_height = min(gray1.shape[0], gray2.shape[0])
                min_width = min(gray1.shape[1], gray2.shape[1])
                gray1 = cv2.resize(gray1, (min_width, min_height))
                gray2 = cv2.resize(gray2, (min_width, min_height))
            
            # Compute SSIM
            similarity_score = ssim(gray1, gray2)
            
            # SSIM can return values slightly outside [0, 1] due to numerical precision
            # Clamp to valid range
            similarity_score = max(0.0, min(1.0, similarity_score))
            
            logger.debug(f"SSIM between frames {frame1.frame_index} and {frame2.frame_index}: {similarity_score:.3f}")
            
            return similarity_score
            
        except Exception as e:
            # SSIM computation failed - fall back to histogram comparison
            logger.warning(f"SSIM computation failed: {e}, falling back to histogram comparison")
            return self.compute_histogram_similarity(frame1, frame2)
    
    def compute_histogram_similarity(self, frame1: Frame, frame2: Frame) -> float:
        """Fallback similarity metric using histogram comparison.
        
        Computes color histogram for each frame and uses correlation to measure
        similarity. This is less sophisticated than SSIM but more robust to
        image size differences and computational issues.
        
        Args:
            frame1: First frame to compare
            frame2: Second frame to compare
        
        Returns:
            Similarity score in [0.0, 1.0] where 1.0 means identical histograms
            
        Requirements: 2.4, 4.3
        """
        try:
            # Convert to HSV color space for better color representation
            hsv1 = cv2.cvtColor(frame1.image, cv2.COLOR_BGR2HSV)
            hsv2 = cv2.cvtColor(frame2.image, cv2.COLOR_BGR2HSV)
            
            # Compute histograms for each channel
            # Using 50 bins for H, 60 for S, 60 for V (standard histogram parameters)
            hist1 = cv2.calcHist([hsv1], [0, 1, 2], None, [50, 60, 60], 
                                [0, 180, 0, 256, 0, 256])
            hist2 = cv2.calcHist([hsv2], [0, 1, 2], None, [50, 60, 60], 
                                [0, 180, 0, 256, 0, 256])
            
            # Normalize histograms
            cv2.normalize(hist1, hist1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            cv2.normalize(hist2, hist2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            
            # Compare histograms using correlation method
            # cv2.HISTCMP_CORREL returns values in [-1, 1] where 1 is identical
            correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
            
            # Normalize to [0, 1] range
            # Correlation of -1 becomes 0 (completely different)
            # Correlation of 1 becomes 1 (identical)
            similarity_score = (correlation + 1.0) / 2.0
            
            # Clamp to valid range in case of numerical issues
            similarity_score = max(0.0, min(1.0, similarity_score))
            
            logger.debug(f"Histogram similarity between frames {frame1.frame_index} and {frame2.frame_index}: {similarity_score:.3f}")
            
            return similarity_score
            
        except Exception as e:
            # If even histogram comparison fails, log error and return 0.0 (completely different)
            # This ensures the frame might still be selected
            logger.error(f"Histogram comparison failed: {e}", exc_info=True)
            return 0.0
    
    def select_frames(self, frames: List[Frame]) -> List[Frame]:
        """Selects diverse representative frames from the extraction set.
        
        Algorithm:
        1. Always include first frame (captures fire onset)
        2. For each remaining frame, compute SSIM with all selected frames
        3. Add frame if SSIM < similarity_threshold with ALL selected frames
        4. Continue until max_frames reached or all candidates exhausted
        5. If fewer than min_frames selected, add frames with lowest similarity to the set
        6. Return frames in chronological order (by timestamp)
        
        Args:
            frames: List of extracted frames to select from
        
        Returns:
            List of selected frames in chronological order
            
        Requirements: 2.1, 2.2, 2.3, 2.5
        """
        try:
            # Handle edge cases
            if not frames:
                logger.warning("No frames provided for selection, returning empty list")
                return []
            
            if len(frames) == 1:
                logger.info("Only one frame available, returning it")
                return frames.copy()
            
            # If we have fewer frames than min_frames, return all frames
            if len(frames) <= self.min_frames:
                logger.info(f"Only {len(frames)} frames available (< min_frames={self.min_frames}), returning all")
                return sorted(frames, key=lambda f: f.timestamp)
            
            # Initialize selected frames list with first frame (fire onset)
            selected_frames = [frames[0]]
            logger.debug(f"Selected first frame (index {frames[0].frame_index}) as fire onset")
            
            # Track similarity scores for frames not yet selected (for min_frames enforcement)
            candidate_similarities = []
            
            # Iterate through remaining frames
            for candidate in frames[1:]:
                # Skip if we've already reached max_frames
                if len(selected_frames) >= self.max_frames:
                    logger.debug(f"Reached max_frames={self.max_frames}, stopping selection")
                    break
                
                try:
                    # Compute similarity with all already selected frames
                    similarities = []
                    for selected in selected_frames:
                        sim = self.compute_similarity(candidate, selected)
                        similarities.append(sim)
                    
                    # Get maximum similarity to any selected frame
                    max_similarity = max(similarities)
                    
                    # Track this candidate for potential min_frames enforcement
                    candidate_similarities.append((candidate, max_similarity))
                    
                    # Add frame if it's sufficiently different from all selected frames
                    if max_similarity < self.similarity_threshold:
                        selected_frames.append(candidate)
                        logger.debug(f"Selected frame {candidate.frame_index} (max_similarity={max_similarity:.3f} < threshold={self.similarity_threshold})")
                    else:
                        logger.debug(f"Rejected frame {candidate.frame_index} (max_similarity={max_similarity:.3f} >= threshold={self.similarity_threshold})")
                
                except Exception as e:
                    # Error processing this frame - log and skip it (requirement 4.3)
                    logger.error(f"Error processing frame {candidate.frame_index}: {e}", exc_info=True)
                    continue
            
            # Enforce min_frames constraint
            # If we have fewer than min_frames, add the most diverse remaining frames
            if len(selected_frames) < self.min_frames:
                logger.info(f"Only {len(selected_frames)} frames selected, adding more to reach min_frames={self.min_frames}")
                
                # Sort candidates by similarity (ascending) - most different first
                candidate_similarities.sort(key=lambda x: x[1])
                
                # Build set of selected frame indices for faster lookup
                selected_indices = {f.frame_index for f in selected_frames}
                
                # Add frames until we reach min_frames or run out of candidates
                for candidate, sim in candidate_similarities:
                    if candidate.frame_index not in selected_indices:
                        selected_frames.append(candidate)
                        selected_indices.add(candidate.frame_index)
                        logger.debug(f"Added frame {candidate.frame_index} to meet min_frames (similarity={sim:.3f})")
                        
                        if len(selected_frames) >= self.min_frames:
                            break
            
            # Sort selected frames by timestamp to maintain chronological order
            selected_frames.sort(key=lambda f: f.timestamp)
            
            logger.info(f"Frame selection complete: selected {len(selected_frames)} frames from {len(frames)} candidates")
            
            return selected_frames
            
        except Exception as e:
            # Critical error in selection algorithm
            logger.error(f"Critical error in select_frames: {e}", exc_info=True)
            
            # Return all frames as fallback - better to have redundant frames than none
            logger.warning("Returning all frames due to selection error")
            return sorted(frames, key=lambda f: f.timestamp)
