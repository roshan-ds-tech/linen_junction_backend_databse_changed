"""
WSGI entry point for PythonAnywhere.

PythonAnywhere's web workers speak WSGI, but the backend (app.py) is an
ASGI application (FastAPI). a2wsgi bridges the two so the ASGI app can be
served by PythonAnywhere without needing an ASGI server (uvicorn/hypercorn)
running behind it.

On PythonAnywhere, point the "WSGI configuration file" at this module and
expose `application` (see the deployment guide in backend/DEPLOYMENT.md).
"""

import sys
from pathlib import Path

# Ensure the backend directory is importable regardless of PythonAnywhere's
# working directory when it loads this file.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from a2wsgi import ASGIMiddleware
from app import app as asgi_app

application = ASGIMiddleware(asgi_app)
