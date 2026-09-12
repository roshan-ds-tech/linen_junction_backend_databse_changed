# Deploying the backend to PythonAnywhere + Cloudinary

The backend is a FastAPI app (`app.py`). PythonAnywhere web apps speak WSGI,
not ASGI, so `wsgi.py` wraps `app.py` with `a2wsgi.ASGIMiddleware`.

**Images** are stored on **Cloudinary** (free tier, no credit card required).
PythonAnywhere only stores the SQLite database — well within the 512 MB free limit.

---

## Step 1 — Get Cloudinary credentials

1. Sign up free at https://cloudinary.com
2. On your dashboard you will see three values — copy them:
   - **Cloud name**
   - **API Key**
   - **API Secret**

---

## Step 2 — Get the code onto PythonAnywhere

Push this repo to GitHub, then from a PythonAnywhere **Bash console**:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
```

(Or use the "Files" tab to upload `backend/` as a zip and unzip it.)

---

## Step 3 — Create a virtualenv and install dependencies

In a Bash console on PythonAnywhere:

```bash
cd ~/<your-repo>/backend
mkvirtualenv --python=/usr/bin/python3.10 linenjunction-venv
pip install -r requirements.txt
```

---

## Step 4 — Create the web app

1. Go to the **Web** tab → **Add a new web app**.
2. Choose **Manual configuration** (NOT the Flask/Django wizard) and pick
   the same Python version as your virtualenv.
3. Under **Virtualenv**, enter the path, e.g.
   `/home/<pa-username>/.virtualenvs/linenjunction-venv`.

---

## Step 5 — Point the WSGI file at wsgi.py

Open the WSGI configuration file linked at the top of the Web tab
(something like `/var/www/<pa-username>_pythonanywhere_com_wsgi.py`).
Delete its contents and replace with:

```python
import sys, os

# Cloudinary credentials — paste your values from Step 1
os.environ["CLOUDINARY_CLOUD_NAME"] = "your_cloud_name"
os.environ["CLOUDINARY_API_KEY"]    = "your_api_key"
os.environ["CLOUDINARY_API_SECRET"] = "your_api_secret"

path = "/home/<pa-username>/<your-repo>/backend"
if path not in sys.path:
    sys.path.insert(0, path)

from wsgi import application
```

---

## Step 6 — Reload and verify

Click **Reload** on the Web tab, then visit
`https://<pa-username>.pythonanywhere.com/` — you should see `API Running`.

Sanity-check a real endpoint:

```bash
curl https://<pa-username>.pythonanywhere.com/api/products
```

---

## Step 7 — Point the frontend at the new backend

Update `.env.production` at the repo root:

```
VITE_API_URL=https://<pa-username>.pythonanywhere.com
```

Redeploy the frontend (Vercel picks this up on the next build/deploy).

---

## Notes

- `database.db` lives on PythonAnywhere's persistent filesystem.
- All images are uploaded to **Cloudinary** and served from their global CDN.
  The database only saves the Cloudinary URL string (a few bytes per image).
- Cloudinary free tier: 25 credits/month — more than enough for a small shop.
- No `/uploads` static file mapping is needed on PythonAnywhere anymore.
- After editing `app.py`, click **Reload** on the Web tab to apply changes.
- CORS is wide open (`allow_origins=["*"]`) — restrict to your Vercel domain
  in production if needed.


