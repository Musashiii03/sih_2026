#!/usr/bin/env python
"""
Standalone runner script for hologram generator
Can be executed from any directory
"""

import sys
from pathlib import Path

# Add parent directory to path to enable imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Now we can import and run
from hologram_generator.cli import main

if __name__ == '__main__':
    sys.exit(main())
