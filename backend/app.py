import os, uuid, json, sqlite3
from datetime import datetime, timezone
from pathlib import Path
from contextlib import contextmanager
import cloudinary, cloudinary.uploader
from flask import Flask, request, jsonify
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = os.environ.get("DATABASE_PATH", str(BASE_DIR / "database.db"))
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)

@contextmanager
def get_db():
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
    with get_db() as conn:
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, sku TEXT, pricePerMeter REAL, category TEXT, description TEXT, image TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, address TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_id TEXT, total_amount REAL, status TEXT, created_at TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, product_id TEXT, quantity INTEGER, price REAL, add_tailoring INTEGER DEFAULT 0, measurements TEXT DEFAULT '{}', selected_meters REAL DEFAULT 0, stitching_type TEXT, stitching_price REAL DEFAULT 0)")
        c.execute("CREATE TABLE IF NOT EXISTS tailoring (id TEXT PRIMARY KEY, order_id TEXT, item_product_id TEXT, measurements TEXT, style TEXT, notes TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, product_id TEXT, color TEXT, gsm TEXT, stock REAL, length REAL)")
        c.execute("CREATE TABLE IF NOT EXISTS cloth_types (id TEXT PRIMARY KEY, name TEXT)")
        c.execute("INSERT OR IGNORE INTO cloth_types (id, name) VALUES ('1','Linen'),('2','Cotton'),('3','Silk')")
        c.execute("CREATE TABLE IF NOT EXISTS tailoring_jobs (id TEXT PRIMARY KEY, order_id TEXT, item_product_id TEXT, tailor_name TEXT, status TEXT, priority TEXT, started_at TEXT, updated_at TEXT, UNIQUE(order_id, item_product_id))")
        c.execute("CREATE TABLE IF NOT EXISTS tailoring_logs (id TEXT PRIMARY KEY, job_id TEXT, status TEXT, note TEXT, tailor TEXT, timestamp TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS tailoring_images (id TEXT PRIMARY KEY, job_id TEXT, type TEXT, url TEXT)")
        conn.commit()
        print("Database initialized [OK]")

_logs = []
def add_log(m):
    _logs.insert(0, m)
    while len(_logs) > 50: _logs.pop()

def _cld_pid(url):
    try:
        p = url.split("/upload/", 1)[1]
        if p.startswith("v") and "/" in p: p = p.split("/", 1)[1]
        return p.rsplit(".", 1)[0]
    except: return ""

def _upload(fs):
    content = fs.read()
    pid = "linen-junction/" + uuid.uuid4().hex
    r = cloudinary.uploader.upload(content, public_id=pid, resource_type="auto")
    return r["secure_url"]

def _delete(url):
    if not url: return
    pid = _cld_pid(url)
    if pid:
        try: cloudinary.uploader.destroy(pid, resource_type="image")
        except Exception as e: print("Cloudinary delete warning:", e)

def pm(raw):
    try: return json.loads(raw or "{}")
    except: return {}

app = Flask(__name__)
CORS(app)
init_db()

@app.route("/")
def health(): return "API Running"

@app.route("/api/logs")
def get_logs(): return jsonify(_logs)

@app.route("/api/products", methods=["GET"])
def get_products():
    with get_db() as conn:
        return jsonify([dict(r) for r in conn.execute("SELECT * FROM products").fetchall()])

@app.route("/api/products", methods=["POST"])
def create_product():
    name = (request.form.get("name") or "").strip()
    sku = request.form.get("sku") or ""
    ppm = float(request.form.get("pricePerMeter") or 0)
    cat = (request.form.get("category") or "").strip()
    desc = request.form.get("description") or ""
    if not name: return jsonify({"error": "Product name required"}), 400
    if not cat: return jsonify({"error": "Category required"}), 400
    pid = uuid.uuid4().hex
    img = ""
    f = request.files.get("image")
    if f and f.filename: img = _upload(f)
    with get_db() as conn:
        conn.execute("INSERT INTO products VALUES (?,?,?,?,?,?,?)", (pid,name,sku,ppm,cat,desc,img))
        conn.commit()
    add_log("Product added: " + name)
    return jsonify({"success": True, "id": pid})

@app.route("/api/products/<pid>", methods=["PUT"])
def update_product(pid):
    b = request.get_json()
    with get_db() as conn:
        conn.execute("UPDATE products SET name=?,sku=?,pricePerMeter=?,category=?,description=? WHERE id=?",
            (b.get("name",""),b.get("sku",""),b.get("pricePerMeter",0),b.get("category",""),b.get("description",""),pid))
        conn.commit()
    return jsonify({"success": True})

@app.route("/api/products/<pid>", methods=["DELETE"])
def delete_product(pid):
    with get_db() as conn:
        r = conn.execute("SELECT image FROM products WHERE id=?", (pid,)).fetchone()
        if r and r["image"]: _delete(r["image"])
        conn.execute("DELETE FROM products WHERE id=?", (pid,))
        conn.commit()
    return jsonify({"success": True})

@app.route("/api/orders", methods=["GET"])
def get_orders():
    with get_db() as conn:
        orders = [dict(r) for r in conn.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()]
        result = []
        for o in orders:
            raw_items = [dict(r) for r in conn.execute("SELECT * FROM order_items WHERE order_id=?", (o["id"],)).fetchall()]
            items = [{**i, "measurements": pm(i.get("measurements")), "addTailoringService": i.get("add_tailoring")==1, "stitchingType": i.get("stitching_type"), "stitchingPrice": i.get("stitching_price",0)} for i in raw_items]
            cr = conn.execute("SELECT * FROM customers WHERE id=?", (o["customer_id"],)).fetchone()
            tr = [dict(r) for r in conn.execute("SELECT * FROM tailoring WHERE order_id=?", (o["id"],)).fetchall()]
            tl = [{**t, "measurements": pm(t.get("measurements"))} for t in tr]
            result.append({**o, "items": items, "customer": dict(cr) if cr else None, "tailoring": tl[0] if tl else None, "tailoringItems": tl})
        return jsonify(result)

@app.route("/api/orders", methods=["POST"])
def create_order():
    b = request.get_json()
    customer = b.get("customer"); items = b.get("items")
    if not customer or not items: return jsonify({"error": "Missing customer or items"}), 400
    oid = uuid.uuid4().hex; cid = uuid.uuid4().hex; now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute("INSERT INTO customers VALUES (?,?,?,?,?)", (cid,customer.get("name",""),customer.get("phone",""),customer.get("email",""),customer.get("address","")))
        total = sum(float(i.get("price",0))*int(i.get("quantity",1)) for i in items)
        conn.execute("INSERT INTO orders VALUES (?,?,?,?,?)", (oid,cid,total,"Pending",now))
        for item in items:
            prodi = item.get("product_id") or item.get("id") or ""
            at = 1 if item.get("addTailoringService") else 0
            meas = json.dumps(item.get("measurements",{}))
            sm = float(item.get("selectedMeters") or item.get("quantity",1))
            conn.execute("INSERT INTO order_items (id,order_id,product_id,quantity,price,add_tailoring,measurements,selected_meters,stitching_type,stitching_price) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (uuid.uuid4().hex,oid,prodi,item.get("quantity",1),item.get("price",0),at,meas,sm,item.get("stitchingType"),item.get("stitchingPrice",0)))
            if item.get("addTailoringService"):
                ex = conn.execute("SELECT id FROM tailoring_jobs WHERE order_id=? AND item_product_id=?", (oid,prodi)).fetchone()
                if not ex:
                    jid = uuid.uuid4().hex
                    conn.execute("INSERT INTO tailoring_jobs (id,order_id,item_product_id,tailor_name,status,priority,started_at) VALUES (?,?,?,?,?,?,?)", (jid,oid,prodi,"Unassigned","Order Received","medium",now))
                    conn.execute("INSERT INTO tailoring_logs VALUES (?,?,?,?,?,?)", (uuid.uuid4().hex,jid,"Order Received","Job created","System",now))
        conn.commit()
    add_log("New order placed: " + oid[:8])
    return jsonify({"success": True, "orderId": oid})

@app.route("/api/orders/<oid>", methods=["DELETE"])
def delete_order(oid):
    with get_db() as conn:
        conn.execute("DELETE FROM order_items WHERE order_id=?", (oid,))
        conn.execute("DELETE FROM tailoring WHERE order_id=?", (oid,))
        conn.execute("DELETE FROM orders WHERE id=?", (oid,))
        conn.commit()
    return jsonify({"success": True})

@app.route("/api/orders/<oid>/status", methods=["PUT"])
def update_order_status(oid):
    b = request.get_json()
    with get_db() as conn:
        conn.execute("UPDATE orders SET status=? WHERE id=?", (b.get("status",""),oid)); conn.commit()
    return jsonify({"success": True})

@app.route("/api/tailoring/jobs", methods=["GET"])
def get_tailoring_jobs():
    with get_db() as conn:
        jobs = [dict(r) for r in conn.execute("SELECT * FROM tailoring_jobs").fetchall()]
        result = []
        for job in jobs:
            logs = [dict(r) for r in conn.execute("SELECT * FROM tailoring_logs WHERE job_id=?", (job["id"],)).fetchall()]
            images = [dict(r) for r in conn.execute("SELECT * FROM tailoring_images WHERE job_id=?", (job["id"],)).fetchall()]
            result.append({**job, "logs": logs, "images": images})
        return jsonify(result)

@app.route("/api/tailoring/<jid>/status", methods=["PUT"])
def update_tailoring_status(jid):
    b = request.get_json(); now = datetime.now(timezone.utc).isoformat()
    status = b.get("status",""); tailor = b.get("tailor","System")
    with get_db() as conn:
        conn.execute("UPDATE tailoring_jobs SET status=?,tailor_name=?,updated_at=? WHERE id=?", (status,tailor,now,jid))
        conn.execute("INSERT INTO tailoring_logs VALUES (?,?,?,?,?,?)", (uuid.uuid4().hex,jid,status,"Status changed to "+status,tailor,now))
        conn.commit()
    return jsonify({"success": True})

@app.route("/api/tailoring/<jid>/priority", methods=["PUT"])
def update_tailoring_priority(jid):
    b = request.get_json(); now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute("UPDATE tailoring_jobs SET priority=?,updated_at=? WHERE id=?", (b.get("priority","medium"),now,jid)); conn.commit()
    return jsonify({"success": True})

@app.route("/api/tailoring/upload", methods=["POST"])
def upload_tailoring_image():
    f = request.files.get("image"); jid = request.form.get("jobId"); t = request.form.get("type","before")
    if not f or not f.filename: return jsonify({"error": "No image provided"}), 400
    url = _upload(f)
    with get_db() as conn:
        conn.execute("INSERT INTO tailoring_images (id,job_id,type,url) VALUES (?,?,?,?)", (uuid.uuid4().hex,jid,t,url)); conn.commit()
    return jsonify({"url": url})

@app.route("/api/tailoring/image/<iid>", methods=["DELETE"])
def delete_tailoring_image(iid):
    with get_db() as conn:
        r = conn.execute("SELECT url FROM tailoring_images WHERE id=?", (iid,)).fetchone()
        if r and r["url"]: _delete(r["url"])
        conn.execute("DELETE FROM tailoring_images WHERE id=?", (iid,)); conn.commit()
    return jsonify({"success": True})

@app.route("/api/tailoring/<jid>", methods=["DELETE"])
def delete_tailoring_job(jid):
    with get_db() as conn:
        for img in conn.execute("SELECT url FROM tailoring_images WHERE job_id=?", (jid,)).fetchall():
            _delete(img["url"])
        conn.execute("DELETE FROM tailoring_logs WHERE job_id=?", (jid,))
        conn.execute("DELETE FROM tailoring_images WHERE job_id=?", (jid,))
        conn.execute("DELETE FROM tailoring_jobs WHERE id=?", (jid,)); conn.commit()
    return jsonify({"success": True})

@app.route("/api/inventory/<pid>", methods=["GET"])
def get_inventory(pid):
    with get_db() as conn:
        return jsonify([dict(r) for r in conn.execute("SELECT * FROM inventory WHERE product_id=?", (pid,)).fetchall()])

@app.route("/api/inventory/update", methods=["POST"])
def update_inventory():
    b = request.get_json(); pid = b.get("productId",""); inv = b.get("inventory",[])
    with get_db() as conn:
        conn.execute("DELETE FROM inventory WHERE product_id=?", (pid,))
        for i in inv:
            conn.execute("INSERT INTO inventory VALUES (?,?,?,?,?,?)", (uuid.uuid4().hex,pid,i.get("color",""),i.get("gsm",""),i.get("stock",0),i.get("length",0)))
        conn.commit()
    return jsonify({"success": True})

@app.route("/api/cloth-types", methods=["GET"])
def get_cloth_types():
    with get_db() as conn:
        return jsonify([dict(r) for r in conn.execute("SELECT * FROM cloth_types").fetchall()])

@app.route("/api/cloth-types", methods=["POST"])
def add_cloth_type():
    b = request.get_json(); name = (b.get("name") or "").strip()
    if not name: return jsonify({"error": "Category name required"}), 400
    tid = uuid.uuid4().hex
    with get_db() as conn:
        conn.execute("INSERT INTO cloth_types (id, name) VALUES (?,?)", (tid,name)); conn.commit()
    return jsonify({"success": True, "id": tid})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
