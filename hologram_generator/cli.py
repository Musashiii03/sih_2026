"""
Command-line interface for hologram generator
"""

import argparse
import sys
import json
from pathlib import Path
from typing import Optional
from loguru import logger

from .hologram_generator import HologramGenerator
from .exceptions import HologramGenerationError


def setup_logging(verbose: bool = False):
    """
    Configure logging for CLI
    
    Args:
        verbose: Enable verbose output
    """
    logger.remove()  # Remove default handler
    
    if verbose:
        logger.add(
            sys.stderr,
            format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
            level="DEBUG"
        )
    else:
        logger.add(
            sys.stderr,
            format="<level>{level: <8}</level> | <level>{message}</level>",
            level="INFO"
        )


def validate_input_file(path: str) -> Path:
    """
    Validate input file exists and is readable
    
    Args:
        path: Input file path
    
    Returns:
        Validated Path object
    
    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file is not a JSON file
    """
    input_path = Path(path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    
    if not input_path.is_file():
        raise ValueError(f"Input path is not a file: {path}")
    
    if input_path.suffix.lower() != '.json':
        logger.warning(f"Input file does not have .json extension: {path}")
    
    return input_path


def validate_output_file(path: Optional[str]) -> Optional[Path]:
    """
    Validate output file path
    
    Args:
        path: Output file path (optional)
    
    Returns:
        Validated Path object or None
    
    Raises:
        ValueError: If output directory doesn't exist
    """
    if path is None:
        return None
    
    output_path = Path(path)
    
    # Check parent directory exists
    if output_path.parent != Path('.') and not output_path.parent.exists():
        raise ValueError(f"Output directory does not exist: {output_path.parent}")
    
    # Add .glb extension if missing
    if output_path.suffix.lower() != '.glb':
        output_path = output_path.with_suffix('.glb')
        logger.info(f"Adding .glb extension: {output_path}")
    
    return output_path


def print_scene_stats(generator: HologramGenerator):
    """
    Print scene statistics
    
    Args:
        generator: HologramGenerator instance
    """
    stats = generator.get_scene_stats()
    
    if not stats:
        return
    
    print("\n" + "=" * 60)
    print("SCENE STATISTICS")
    print("=" * 60)
    print(f"Incident ID:      {stats.get('incident_id', 'N/A')}")
    print(f"Timestamp:        {stats.get('timestamp', 'N/A')}")
    print(f"Mesh Count:       {stats.get('mesh_count', 0)}")
    print(f"Total Vertices:   {stats.get('total_vertices', 0):,}")
    print(f"Total Faces:      {stats.get('total_faces', 0):,}")
    print("=" * 60 + "\n")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="3D Fire Detection Hologram Generator - Generate GLB models from detection data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate hologram from detection data
  python -m hologram_generator.cli --input detection_data.json --output hologram.glb
  
  # Generate with verbose output
  python -m hologram_generator.cli -i data.json -o output.glb --verbose
  
  # Generate with auto-generated filename
  python -m hologram_generator.cli -i data.json

For more information, visit: https://github.com/atmarakshak/hologram-generator
        """
    )
    
    # Required arguments
    parser.add_argument(
        '-i', '--input',
        type=str,
        required=True,
        help='Input JSON file containing detection data'
    )
    
    # Optional arguments
    parser.add_argument(
        '-o', '--output',
        type=str,
        default=None,
        help='Output GLB file path (default: auto-generated)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    parser.add_argument(
        '--stats',
        action='store_true',
        help='Print scene statistics after generation'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='Hologram Generator v1.0.0'
    )
    
    # Parse arguments
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    
    try:
        # Validate input
        logger.info("Validating input file...")
        input_path = validate_input_file(args.input)
        logger.info(f"Input file: {input_path}")
        
        # Validate output
        output_path = None
        if args.output:
            output_path = validate_output_file(args.output)
            logger.info(f"Output file: {output_path}")
        
        # Create generator
        logger.info("Initializing hologram generator...")
        generator = HologramGenerator(verbose=args.verbose)
        
        # Generate hologram
        logger.info("Starting hologram generation...")
        result_path = generator.generate_from_json(
            input_path,
            output_path=str(output_path) if output_path else None
        )
        
        # Print statistics if requested
        if args.stats:
            print_scene_stats(generator)
        
        # Success message
        logger.success(f"✓ Hologram generated successfully: {result_path}")
        
        # Verify file
        result_file = Path(result_path)
        if result_file.exists():
            file_size_mb = result_file.stat().st_size / (1024 * 1024)
            logger.info(f"File size: {file_size_mb:.2f} MB")
        
        return 0
        
    except FileNotFoundError as e:
        logger.error(f"✗ File error: {str(e)}")
        return 1
    
    except ValueError as e:
        logger.error(f"✗ Validation error: {str(e)}")
        return 1
    
    except HologramGenerationError as e:
        logger.error(f"✗ Generation error: {str(e)}")
        return 1
    
    except KeyboardInterrupt:
        logger.warning("\n✗ Generation interrupted by user")
        return 130
    
    except Exception as e:
        logger.error(f"✗ Unexpected error: {str(e)}")
        if args.verbose:
            logger.exception("Full traceback:")
        return 1


if __name__ == '__main__':
    sys.exit(main())
