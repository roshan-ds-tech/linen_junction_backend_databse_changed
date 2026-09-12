"""
Linen Junction — FastAPI Backend
Complete rewrite of Express/Node.js backend.
Same API contract — zero frontend breaking changes.
"""

import os
import uuid
import json
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from contextlib import contextmanager
from typing import Optional

import cloudinary
import cloudinary.uploader

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import sqlite3


# ═══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ═══════════════════════════════════════════════════════════════

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = os.environ.get("DATABASE_PATH", str(BASE_DIR / "database.db"))

# Cloudinary configuration — set these three env vars on PythonAnywhere
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)


# ═══════════════════════════════════════════════════════════════
#  DATABASE
# ═══════════════════════════════════════════════════════════════

@contextmanager
def get_db():
    """Context manager that yields a configured SQLite connection."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=5000")
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist."""
    with get_db() as conn:
        c = conn.cursor()

        c.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT,
                sku TEXT,
                pricePerMeter REAL,
                category TEXT,
                description TEXT,
                image TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT,
                phone TEXT,
                email TEXT,
                address TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                customer_id TEXT,
                total_amount REAL,
                status TEXT,
                created_at TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id TEXT PRIMARY KEY,
                order_id TEXT,
                product_id TEXT,
                quantity INTEGER,
                price REAL,
                add_tailoring INTEGER DEFAULT 0,
                measurements TEXT DEFAULT '{}',
                selected_meters REAL DEFAULT 0,
                stitching_type TEXT,
                stitching_price REAL DEFAULT 0
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS tailoring (
                id TEXT PRIMARY KEY,
                order_id TEXT,
                item_product_id TEXT,
                measurements TEXT,
                style TEXT,
                notes TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                id TEXT PRIMARY KEY,
                product_id TEXT,
                color TEXT,
                gsm TEXT,
                stock REAL,
                length REAL
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS cloth_types (
                id TEXT PRIMARY KEY,
                name TEXT
            )
        """)

        c.execute("""
            INSERT OR IGNORE INTO cloth_types (id, name) VALUES
            ('1', 'Linen'),
            ('2', 'Cotton'),
            ('3', 'Silk')
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS tailoring_jobs (
                id TEXT PRIMARY KEY,
                order_id TEXT,
                item_product_id TEXT,
                tailor_name TEXT,
                status TEXT,
                priority TEXT,
                started_at TEXT,
                updated_at TEXT,
                UNIQUE(order_id, item_product_id)
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS tailoring_logs (
                id TEXT PRIMARY KEY,
                job_id TEXT,
                status TEXT,
                note TEXT,
                tailor TEXT,
                timestamp TEXT
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS tailoring_images (
                id TEXT PRIMARY KEY,
                job_id TEXT,
                type TEXT,
                url TEXT
            )
        """)

        conn.commit()
        print("Database initialized [OK]")


# ═══════════════════════════════════════════════════════════════
#  ACTIVITY LOG  (in-memory, replaces Socket.io broadcasts)
# ═══════════════════════════════════════════════════════════════

_activity_logs: list = []
_MAX_LOGS = 50


def add_log(message: str):
    """Add an activity log entry (most recent first)."""
    _activity_logs.insert(0, message)
    while len(_activity_logs) > _MAX_LOGS:
        _activity_logs.pop()


# ═══════════════════════════════════════════════════════════════
#  CLOUDINARY HELPERS
# ═══════════════════════════════════════════════════════════════

def _cloudinary_public_id(url: str) -> str:
    """Extract Cloudinary public_id from a secure_url (needed for deletion)."""
    try:
        # URL format: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{public_id}.{ext}
        upload_part = url.split("/upload/", 1)[1]
        # Strip version prefix if present (e.g. "v1234567/...")
        if upload_part.startswith("v") and "/" in upload_part:
            upload_part = upload_part.split("/", 1)[1]
        # Strip file extension
        return upload_part.rsplit(".", 1)[0]
    except Exception:
        return ""


async def _upload_to_cloudinary(file: UploadFile) -> str:
    """Upload a file to Cloudinary and return its public secure URL."""
    content = await file.read()
    public_id = f"linen-junction/{uuid.uuid4().hex}"
    result = await asyncio.to_thread(
        cloudinary.uploader.upload,
        content,
        public_id=public_id,
        resource_type="auto",
    )
    return result["secure_url"]


def _delete_from_cloudinary(url: str):
    """Delete a file from Cloudinary by its URL. Silently ignores errors."""
    if not url:
        return
    public_id = _cloudinary_public_id(url)
    if public_id:
        try:
            cloudinary.uploader.destroy(public_id, resource_type="image")
        except Exception as e:
            print(f"Cloudinary delete warning: {e}")


# ═══════════════════════════════════════════════════════════════
#  FASTAPI APP
# ═══════════════════════════════════════════════════════════════

app = FastAPI(title="Linen Junction API")

# Initialise DB synchronously at import time so a2wsgi / PythonAnywhere
# WSGI workers never deadlock waiting for the async lifespan to complete.
init_db()

# CORS -- allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ═══════════════════════════════════════════════════════════════

@app.get("/")
def health_check():
    return PlainTextResponse("API Running 🚀")


# ═══════════════════════════════════════════════════════════════
#  ACTIVITY LOGS  (polled by admin dashboard)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/logs")
def get_logs():
    return _activity_logs


# ═══════════════════════════════════════════════════════════════
#  PRODUCTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/products")
def get_products():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM products").fetchall()
        return [dict(r) for r in rows]


@app.post("/api/products")
async def create_product(
    name: str = Form(""),
    sku: str = Form(""),
    pricePerMeter: float = Form(0),
    category: str = Form(""),
    description: str = Form(""),
    image: Optional[UploadFile] = File(None),
):
    name = name.strip()
    category = category.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Product name is required")
    if not category:
        raise HTTPException(status_code=400, detail="Category is required")

    product_id = uuid.uuid4().hex
    image_path = ""

    if image and image.filename:
        image_path = await _upload_to_cloudinary(image)

    with get_db() as conn:
        conn.execute(
            """INSERT INTO products
               (id, name, sku, pricePerMeter, category, description, image)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (product_id, name, sku, pricePerMeter, category, description, image_path),
        )
        conn.commit()

    add_log(f'✅ Product "{name}" added')
    print(f"PRODUCT SAVED: {name} [{category}]")
    return {"success": True, "id": product_id}


@app.put("/api/products/{product_id}")
async def update_product(product_id: str, request: Request):
    body = await request.json()

    with get_db() as conn:
        conn.execute(
            """UPDATE products
               SET name=?, sku=?, pricePerMeter=?, category=?, description=?
               WHERE id=?""",
            (
                body.get("name", ""),
                body.get("sku", ""),
                body.get("pricePerMeter", 0),
                body.get("category", ""),
                body.get("description", ""),
                product_id,
            ),
        )
        conn.commit()

    add_log(f'✏️ Product "{body.get("name", "")}" updated')
    return {"success": True}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: str):
    with get_db() as conn:
        # Delete associated image from Cloudinary
        row = conn.execute(
            "SELECT image FROM products WHERE id=?", (product_id,)
        ).fetchone()
        if row and row["image"]:
            _delete_from_cloudinary(row["image"])

        conn.execute("DELETE FROM products WHERE id=?", (product_id,))
        conn.commit()

    add_log(f"🗑 Product {product_id[:8]} deleted")
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  ORDERS
# ═══════════════════════════════════════════════════════════════

def _parse_measurements(raw: str) -> dict:
    """Safely parse a JSON measurements string."""
    try:
        return json.loads(raw or "{}")
    except (json.JSONDecodeError, TypeError):
        return {}


@app.get("/api/orders")
def get_orders():
    with get_db() as conn:
        orders = [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM orders ORDER BY created_at DESC"
            ).fetchall()
        ]

        result = []
        for order in orders:
            # ── Items ──
            raw_items = [
                dict(r)
                for r in conn.execute(
                    "SELECT * FROM order_items WHERE order_id=?", (order["id"],)
                ).fetchall()
            ]

            items = []
            for item in raw_items:
                items.append(
                    {
                        **item,
                        "measurements": _parse_measurements(
                            item.get("measurements")
                        ),
                        "addTailoringService": item.get("add_tailoring") == 1,
                        "stitchingType": item.get("stitching_type"),
                        "stitchingPrice": item.get("stitching_price", 0),
                    }
                )

            # ── Customer ──
            customer_row = conn.execute(
                "SELECT * FROM customers WHERE id=?", (order["customer_id"],)
            ).fetchone()
            customer = dict(customer_row) if customer_row else None

            # ── Tailoring rows ──
            tailoring_rows = [
                dict(r)
                for r in conn.execute(
                    "SELECT * FROM tailoring WHERE order_id=?", (order["id"],)
                ).fetchall()
            ]
            tailoring_list = [
                {**t, "measurements": _parse_measurements(t.get("measurements"))}
                for t in tailoring_rows
            ]

            result.append(
                {
                    **order,
                    "items": items,
                    "customer": customer,
                    "tailoring": tailoring_list[0] if tailoring_list else None,
                    "tailoringItems": tailoring_list,
                }
            )

        return result


@app.post("/api/orders")
async def create_order(request: Request):
    body = await request.json()

    customer = body.get("customer")
    items = body.get("items")

    if not customer or not items or not isinstance(items, list):
        raise HTTPException(status_code=400, detail="Missing customer or items")

    order_id = uuid.uuid4().hex
    customer_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        # ── Customer ──
        conn.execute(
            "INSERT INTO customers VALUES (?, ?, ?, ?, ?)",
            (
                customer_id,
                customer.get("name", ""),
                customer.get("phone", ""),
                customer.get("email", ""),
                customer.get("address", ""),
            ),
        )

        # ── Order total ──
        total = sum(
            float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in items
        )

        conn.execute(
            "INSERT INTO orders VALUES (?, ?, ?, ?, ?)",
            (order_id, customer_id, total, "Pending", now),
        )

        # ── Order items + tailoring jobs ──
        for item in items:
            product_id = item.get("product_id") or item.get("id") or ""
            add_tailoring = 1 if item.get("addTailoringService") else 0
            measurements = json.dumps(item.get("measurements", {}))
            selected_meters = float(
                item.get("selectedMeters") or item.get("quantity", 1)
            )

            conn.execute(
                """INSERT INTO order_items
                   (id, order_id, product_id, quantity, price,
                    add_tailoring, measurements, selected_meters,
                    stitching_type, stitching_price)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    uuid.uuid4().hex,
                    order_id,
                    product_id,
                    item.get("quantity", 1),
                    item.get("price", 0),
                    add_tailoring,
                    measurements,
                    selected_meters,
                    item.get("stitchingType"),
                    item.get("stitchingPrice", 0),
                ),
            )

            # Create tailoring job for items that opted in
            if item.get("addTailoringService"):
                existing = conn.execute(
                    "SELECT id FROM tailoring_jobs WHERE order_id=? AND item_product_id=?",
                    (order_id, product_id),
                ).fetchone()

                if not existing:
                    job_id = uuid.uuid4().hex
                    conn.execute(
                        """INSERT INTO tailoring_jobs
                           (id, order_id, item_product_id, tailor_name,
                            status, priority, started_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (
                            job_id,
                            order_id,
                            product_id,
                            "Unassigned",
                            "Order Received",
                            "medium",
                            now,
                        ),
                    )

                    conn.execute(
                        "INSERT INTO tailoring_logs VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            uuid.uuid4().hex,
                            job_id,
                            "Order Received",
                            "Job created",
                            "System",
                            now,
                        ),
                    )

        conn.commit()

    add_log(f"🛒 New order #{order_id[:8]} placed")
    return {"success": True, "orderId": order_id}


@app.delete("/api/orders/{order_id}")
def delete_order(order_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM order_items WHERE order_id=?", (order_id,))
        conn.execute("DELETE FROM tailoring WHERE order_id=?", (order_id,))
        conn.execute("DELETE FROM orders WHERE id=?", (order_id,))
        conn.commit()

    add_log(f"🗑 Order {order_id[:8]} deleted")
    return {"success": True}


@app.put("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request):
    body = await request.json()
    status = body.get("status", "")

    with get_db() as conn:
        conn.execute(
            "UPDATE orders SET status=? WHERE id=?", (status, order_id)
        )
        conn.commit()

    add_log(f"📋 Order #{order_id[:8]} → {status}")
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  TAILORING JOBS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/tailoring/jobs")
def get_tailoring_jobs():
    with get_db() as conn:
        jobs = [
            dict(r) for r in conn.execute("SELECT * FROM tailoring_jobs").fetchall()
        ]

        result = []
        for job in jobs:
            logs = [
                dict(r)
                for r in conn.execute(
                    "SELECT * FROM tailoring_logs WHERE job_id=?", (job["id"],)
                ).fetchall()
            ]
            images = [
                dict(r)
                for r in conn.execute(
                    "SELECT * FROM tailoring_images WHERE job_id=?", (job["id"],)
                ).fetchall()
            ]
            result.append({**job, "logs": logs, "images": images})

        return result


@app.put("/api/tailoring/{job_id}/status")
async def update_tailoring_status(job_id: str, request: Request):
    body = await request.json()
    status = body.get("status", "")
    tailor = body.get("tailor", "System")
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            """UPDATE tailoring_jobs
               SET status=?, tailor_name=?, updated_at=?
               WHERE id=?""",
            (status, tailor, now, job_id),
        )

        conn.execute(
            "INSERT INTO tailoring_logs VALUES (?, ?, ?, ?, ?, ?)",
            (
                uuid.uuid4().hex,
                job_id,
                status,
                f"Status changed to {status}",
                tailor,
                now,
            ),
        )
        conn.commit()

    add_log(f"🧵 Job {job_id[:8]} → {status}")
    return {"success": True}


@app.put("/api/tailoring/{job_id}/priority")
async def update_tailoring_priority(job_id: str, request: Request):
    body = await request.json()
    priority = body.get("priority", "medium")
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute(
            "UPDATE tailoring_jobs SET priority=?, updated_at=? WHERE id=?",
            (priority, now, job_id),
        )
        conn.commit()

    return {"success": True}


@app.post("/api/tailoring/upload")
async def upload_tailoring_image(
    image: UploadFile = File(...),
    jobId: str = Form(...),
    type: str = Form("before"),
):
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No image provided")

    image_path = await _upload_to_cloudinary(image)

    with get_db() as conn:
        conn.execute(
            "INSERT INTO tailoring_images (id, job_id, type, url) VALUES (?, ?, ?, ?)",
            (uuid.uuid4().hex, jobId, type, image_path),
        )
        conn.commit()

    return {"url": image_path}


@app.delete("/api/tailoring/image/{image_id}")
def delete_tailoring_image(image_id: str):
    with get_db() as conn:
        # Delete image from Cloudinary
        row = conn.execute(
            "SELECT url FROM tailoring_images WHERE id=?", (image_id,)
        ).fetchone()
        if row and row["url"]:
            _delete_from_cloudinary(row["url"])

        conn.execute("DELETE FROM tailoring_images WHERE id=?", (image_id,))
        conn.commit()

    return {"success": True}


@app.delete("/api/tailoring/{job_id}")
def delete_tailoring_job(job_id: str):
    with get_db() as conn:
        # Delete all job images from Cloudinary
        images = conn.execute(
            "SELECT url FROM tailoring_images WHERE job_id=?", (job_id,)
        ).fetchall()
        for img in images:
            _delete_from_cloudinary(img["url"])

        conn.execute("DELETE FROM tailoring_logs WHERE job_id=?", (job_id,))
        conn.execute("DELETE FROM tailoring_images WHERE job_id=?", (job_id,))
        conn.execute("DELETE FROM tailoring_jobs WHERE id=?", (job_id,))
        conn.commit()

    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  INVENTORY
# ═══════════════════════════════════════════════════════════════

@app.get("/api/inventory/{product_id}")
def get_inventory(product_id: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM inventory WHERE product_id=?", (product_id,)
        ).fetchall()
        return [dict(r) for r in rows]


@app.post("/api/inventory/update")
async def update_inventory(request: Request):
    body = await request.json()
    product_id = body.get("productId", "")
    inventory_items = body.get("inventory", [])

    with get_db() as conn:
        conn.execute("DELETE FROM inventory WHERE product_id=?", (product_id,))

        for item in inventory_items:
            conn.execute(
                "INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?)",
                (
                    uuid.uuid4().hex,
                    product_id,
                    item.get("color", ""),
                    item.get("gsm", ""),
                    item.get("stock", 0),
                    item.get("length", 0),
                ),
            )

        conn.commit()

    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  CLOTH TYPES / CATEGORIES
# ═══════════════════════════════════════════════════════════════

@app.get("/api/cloth-types")
def get_cloth_types():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM cloth_types").fetchall()
        return [dict(r) for r in rows]


@app.post("/api/cloth-types")
async def add_cloth_type(request: Request):
    body = await request.json()
    name = (body.get("name") or "").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Category name required")

    type_id = uuid.uuid4().hex

    with get_db() as conn:
        conn.execute(
            "INSERT INTO cloth_types (id, name) VALUES (?, ?)", (type_id, name)
        )
        conn.commit()

    add_log(f'🧵 Category "{name}" added')
    return {"success": True, "id": type_id}


# Static file serving removed — images are now hosted on Cloudinary CDN


# ═══════════════════════════════════════════════════════════════
#  LOCAL DEV SERVER
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Linen Junction API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
