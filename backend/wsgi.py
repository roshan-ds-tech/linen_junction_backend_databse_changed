"""
WSGI entry point for PythonAnywhere.
Flask is a native WSGI framework — no bridge needed.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import app as application
