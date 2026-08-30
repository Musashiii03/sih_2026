"""
Manual verification test for FrameExtractionConfig.

This script tests the configuration module's functionality:
1. Default configuration loading
2. Validation of valid ranges
3. Rejection of invalid values
4. Custom environment variable loading

Run with: python test_config.py
"""

import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


def test_default_config():
    """Test that default configuration loads successfully."""
    print("Test 1: Default Configuration Loading")
    print("-" * 50)
    
    # Clear any existing env vars
    for key in ['FRAME_SAMPLE_RATE', 'FRAME_WINDOW_DURATION', 
                'FRAME_MIN_SELECTION', 'FRAME_MAX_SELECTION']:
        if key in os.environ:
            del os.environ[key]
    
    # Reload module
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    from frame_extraction.config import FrameExtractionConfig
    
    assert FrameExtractionConfig.SAMPLE_RATE == 3.0, "Default sample rate should be 3.0"
    assert FrameExtractionConfig.WINDOW_DURATION == 30, "Default window duration should be 30"
    assert FrameExtractionConfig.MIN_FRAMES == 6, "Default min frames should be 6"
    assert FrameExtractionConfig.MAX_FRAMES == 15, "Default max frames should be 15"
    assert FrameExtractionConfig.SIMILARITY_THRESHOLD == 0.85, "Default similarity threshold should be 0.85"
    assert FrameExtractionConfig.IMAGE_QUALITY == 90, "Default image quality should be 90"
    
    print("✅ Default configuration loaded successfully")
    print(FrameExtractionConfig.get_summary())
    return True


def test_invalid_sample_rate():
    """Test that invalid sample rate is rejected."""
    print("\nTest 2: Invalid Sample Rate Rejection")
    print("-" * 50)
    
    os.environ['FRAME_SAMPLE_RATE'] = '10.0'  # Invalid: > 5.0
    
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    try:
        from frame_extraction.config import FrameExtractionConfig
        print("❌ Validation should have failed for sample rate 10.0")
        return False
    except AssertionError as e:
        print(f"✅ Validation correctly rejected invalid sample rate")
        print(f"   Error message: {e}")
        return True


def test_invalid_window_duration():
    """Test that invalid window duration is rejected."""
    print("\nTest 3: Invalid Window Duration Rejection")
    print("-" * 50)
    
    os.environ['FRAME_SAMPLE_RATE'] = '3.0'  # Valid
    os.environ['FRAME_WINDOW_DURATION'] = '90'  # Invalid: > 60
    
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    try:
        from frame_extraction.config import FrameExtractionConfig
        print("❌ Validation should have failed for window duration 90")
        return False
    except AssertionError as e:
        print(f"✅ Validation correctly rejected invalid window duration")
        print(f"   Error message: {e}")
        return True


def test_invalid_frame_selection():
    """Test that invalid frame selection bounds are rejected."""
    print("\nTest 4: Invalid Frame Selection Bounds Rejection")
    print("-" * 50)
    
    os.environ['FRAME_SAMPLE_RATE'] = '3.0'
    os.environ['FRAME_WINDOW_DURATION'] = '30'
    os.environ['FRAME_MIN_SELECTION'] = '20'  # Invalid: > 15
    os.environ['FRAME_MAX_SELECTION'] = '25'  # Invalid: > 15
    
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    try:
        from frame_extraction.config import FrameExtractionConfig
        print("❌ Validation should have failed for frame selection 20-25")
        return False
    except AssertionError as e:
        print(f"✅ Validation correctly rejected invalid frame selection bounds")
        print(f"   Error message: {e}")
        return True


def test_custom_config():
    """Test that valid custom configuration loads correctly."""
    print("\nTest 5: Custom Configuration Loading")
    print("-" * 50)
    
    os.environ['FRAME_SAMPLE_RATE'] = '4.5'
    os.environ['FRAME_WINDOW_DURATION'] = '45'
    os.environ['FRAME_MIN_SELECTION'] = '8'
    os.environ['FRAME_MAX_SELECTION'] = '12'
    os.environ['FRAME_SIMILARITY_THRESHOLD'] = '0.90'
    os.environ['FRAME_IMAGE_QUALITY'] = '85'
    
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    from frame_extraction.config import FrameExtractionConfig
    
    assert FrameExtractionConfig.SAMPLE_RATE == 4.5
    assert FrameExtractionConfig.WINDOW_DURATION == 45
    assert FrameExtractionConfig.MIN_FRAMES == 8
    assert FrameExtractionConfig.MAX_FRAMES == 12
    assert FrameExtractionConfig.SIMILARITY_THRESHOLD == 0.90
    assert FrameExtractionConfig.IMAGE_QUALITY == 85
    
    print("✅ Custom configuration loaded successfully")
    print(FrameExtractionConfig.get_summary())
    return True


def test_edge_cases():
    """Test boundary values."""
    print("\nTest 6: Edge Case Validation")
    print("-" * 50)
    
    # Test minimum valid values
    os.environ['FRAME_SAMPLE_RATE'] = '2.0'  # Min valid
    os.environ['FRAME_WINDOW_DURATION'] = '30'  # Min valid
    os.environ['FRAME_MIN_SELECTION'] = '6'  # Min valid
    os.environ['FRAME_MAX_SELECTION'] = '6'  # Equal to min is valid
    
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    try:
        from frame_extraction.config import FrameExtractionConfig
        print("✅ Minimum valid values accepted")
    except AssertionError as e:
        print(f"❌ Minimum valid values should have been accepted: {e}")
        return False
    
    # Test maximum valid values
    os.environ['FRAME_SAMPLE_RATE'] = '5.0'  # Max valid
    os.environ['FRAME_WINDOW_DURATION'] = '60'  # Max valid
    os.environ['FRAME_MIN_SELECTION'] = '15'  # Max valid
    os.environ['FRAME_MAX_SELECTION'] = '15'  # Max valid
    
    if 'frame_extraction.config' in sys.modules:
        del sys.modules['frame_extraction.config']
    
    try:
        from frame_extraction.config import FrameExtractionConfig
        print("✅ Maximum valid values accepted")
        return True
    except AssertionError as e:
        print(f"❌ Maximum valid values should have been accepted: {e}")
        return False


def main():
    """Run all configuration tests."""
    print("=" * 50)
    print("Frame Extraction Configuration Tests")
    print("=" * 50)
    
    tests = [
        test_default_config,
        test_invalid_sample_rate,
        test_invalid_window_duration,
        test_invalid_frame_selection,
        test_custom_config,
        test_edge_cases
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
        return 0
    else:
        print(f"❌ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
