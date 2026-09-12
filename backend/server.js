const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional but safe
});

// ================= DATABASE =================
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error(err.message);
  else {
    console.log("Connected to SQLite DB ✅");
    db.run("PRAGMA journal_mode = WAL;");
    db.configure("busyTimeout", 5000);
  }
  db.run("PRAGMA foreign_keys = ON");
});

// ================= TABLES =================

db.run(`
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT,
  sku TEXT,
  pricePerMeter REAL,
  category TEXT,
  description TEXT,
  image TEXT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  total_amount REAL,
  status TEXT,
  created_at TEXT
)`);

// FIX 1: order_items now stores add_tailoring + measurements + selected_meters
// These are the cart fields that were being dropped on save
db.run(`
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  product_id TEXT,
  quantity INTEGER,
  price REAL,
  add_tailoring INTEGER,
  measurements TEXT,
  selected_meters REAL,

  stitching_type TEXT,        -- ✅ ADD THIS
  stitching_price REAL DEFAULT 0   -- ✅ ADD THIS
)
`);

// FIX 2: tailoring table gets item_product_id so we can match per-item jobs
db.run(`
CREATE TABLE IF NOT EXISTS tailoring (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  item_product_id TEXT,
  measurements TEXT,
  style TEXT,
  notes TEXT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  color TEXT,
  gsm TEXT,
  stock REAL,
  length REAL
)`);

db.run(`
CREATE TABLE IF NOT EXISTS cloth_types (
  id TEXT PRIMARY KEY,
  name TEXT
)`);

db.run(`
INSERT OR IGNORE INTO cloth_types (id, name) VALUES
('1', 'Linen'),
('2', 'Cotton'),
('3', 'Silk')
`);

// ================= TAILORING JOBS =================

db.run(`
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
);`);

db.run(`
CREATE TABLE IF NOT EXISTS tailoring_logs (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  status TEXT,
  note TEXT,
  tailor TEXT,
  timestamp TEXT
)`);

db.run(`
CREATE TABLE IF NOT EXISTS tailoring_images (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  type TEXT,
  url TEXT
)`);

// Run migrations for existing DBs that are missing the new columns
// Safe to run on every start — ADD COLUMN is a no-op if column exists
const migrations = [
  `ALTER TABLE order_items ADD COLUMN add_tailoring INTEGER DEFAULT 0`,
  `ALTER TABLE order_items ADD COLUMN measurements TEXT DEFAULT '{}'`,
  `ALTER TABLE order_items ADD COLUMN selected_meters REAL DEFAULT 0`,
  `ALTER TABLE tailoring ADD COLUMN item_product_id TEXT`,
  `ALTER TABLE order_items ADD COLUMN stitching_type TEXT`,
  `ALTER TABLE order_items ADD COLUMN stitching_price REAL DEFAULT 0`,
];
migrations.forEach((sql) => {
  db.run(sql, (err) => {
    // Ignore "duplicate column" errors — expected on existing DBs
    if (err && !err.message.includes("duplicate column")) {
      console.warn("Migration warning:", err.message);
    }
  });
});

// ================= SOCKET =================
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Admin connected via socket:", socket.id);

  socket.on("log", (msg) => {
    // Broadcast log to all connected admins
    io.emit("log", msg);
  });
});

// ================= HELPERS =================

// Emit order:update to all clients so AdminDashboard refetches
const broadcastOrderUpdate = () => {
  io.emit("order:update");
};

// ================= PRODUCTS =================

app.post(
  "/api/products",
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    // ✅ Handle FormData properly
    if (contentType.includes("multipart/form-data")) {
      upload.single("image")(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  },
  (req, res) => {
    console.log("BODY RECEIVED:", req.body);

    const name = req.body.name || "";
    const sku = req.body.sku || "";
    let category = req.body.category;

    // ✅ handle array case
    if (Array.isArray(category)) {
      category = category[0];
    }

    // ✅ ensure string
    category = String(category || "");

    if (!category.trim()) {
      return res.status(400).json({ error: "Category is required" });
    }
    const description = req.body.description || "";
    const pricePerMeter = Number(req.body.pricePerMeter || 0);

    // 🔴 This is where it was failing before
    if (!category || category.trim() === "") {
      return res.status(400).json({ error: "Category is required" });
    }

    const id = Date.now().toString();
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    db.run(
      `INSERT INTO products (id, name, sku, pricePerMeter, category, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, sku, pricePerMeter, category, description, imagePath],
      function (err) {
        if (err) {
          console.error("DB ERROR:", err.message);
          return res.status(500).json({ error: err.message });
        }

        console.log("✅ PRODUCT SAVED:", name, category);
        res.json({ success: true, id });
      },
    );
  },
);

app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, sku, pricePerMeter, category, description } = req.body;

  db.run(
    `UPDATE products SET name=?, sku=?, pricePerMeter=?, category=?, description=? WHERE id=?`,
    [name, sku, pricePerMeter, category, description, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      io.emit("log", `✏️ Product "${name}" updated`);
      res.json({ success: true });
    },
  );
});

app.delete("/api/products/:id", (req, res) => {
  db.run(`DELETE FROM products WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ================= ORDERS =================

// FIX 3: POST /api/orders now correctly reads product_id from cart items
// CartItem has `id` as the product id — we also accept explicit product_id
app.post("/api/orders", (req, res) => {
  const { customer, items, tailoring } = req.body;

  if (!customer || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing customer or items" });
  }

  const orderId = Date.now().toString();
  const customerId = (Date.now() + 1).toString();

  db.serialize(() => {
    db.run(
      `INSERT INTO customers VALUES (?, ?, ?, ?, ?)`,
      [
        customerId,
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
      ],
      (err) => {
        if (err) console.error("Customer insert:", err.message);
      },
    );

    const total = items.reduce(
      (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1),
      0,
    );

    db.run(
      `INSERT INTO orders VALUES (?, ?, ?, ?, ?)`,
      [orderId, customerId, total, "Pending", new Date().toISOString()],
      (err) => {
        if (err) console.error("Order insert:", err.message);
      },
    );

    items.forEach((item) => {
      // FIX: CartItem uses `id` as the product identifier, not `product_id`
      // We accept both so it works from Checkout and any future API callers
      const productId = item.product_id || item.id || "";
      const addTailoring = item.addTailoringService ? 1 : 0;
      const measurements = JSON.stringify(item.measurements || {});
      const selectedMeters = Number(item.selectedMeters || item.quantity || 1);

      db.run(
        `INSERT INTO order_items 
  (id, order_id, product_id, quantity, price, add_tailoring, measurements, selected_meters, stitching_type, stitching_price)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Date.now().toString() + Math.random(),
          orderId,
          productId,
          item.quantity || 1,
          item.price || 0,
          addTailoring,
          measurements,
          selectedMeters,
          item.stitchingType || null, // ✅ NEW
          item.stitchingPrice || 0, // ✅ NEW
        ],
      );

      // FIX 4: Create a tailoring row per item that has addTailoringService=true
      // Previously only one tailoring row per order — missed multi-item orders
      if (item.addTailoringService) {
        const jobId = Date.now().toString() + Math.random();

        db.get(
          `SELECT id FROM tailoring_jobs WHERE order_id=? AND item_product_id=?`,
          [orderId, productId],
          (err, existing) => {
            if (err) {
              console.error("Check job error:", err.message);
              return;
            }

            // ✅ ONLY CREATE IF NOT EXISTS
            if (!existing) {
              db.run(
                `INSERT INTO tailoring_jobs 
          (id, order_id, item_product_id, tailor_name, status, priority, started_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  jobId,
                  orderId,
                  productId,
                  "Unassigned",
                  "Order Received",
                  "medium",
                  new Date().toISOString(),
                ],
                function (err) {
                  if (err) {
                    console.error("Job insert error:", err.message);
                    return;
                  }

                  // ✅ ONLY ADD LOG IF JOB CREATED
                  db.run(
                    `INSERT INTO tailoring_logs VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                      Date.now().toString() + Math.random(),
                      jobId,
                      "Order Received",
                      "Job created",
                      "System",
                      new Date().toISOString(),
                    ],
                  );
                },
              );
            }
          },
        );
      }
    });
    // Slight delay so all inserts are committed before responding + broadcasting
    setTimeout(() => {
      io.emit("log", `🛒 New order #${orderId} placed`);
      broadcastOrderUpdate(); // FIX 5: notify admin dashboard in real-time
      res.json({ success: true, orderId });
    }, 100);
  });
});

// GET /api/orders — returns full order with items, customer, tailoring
app.get("/api/orders", (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });

    const promises = orders.map(
      (order) =>
        new Promise((resolve) => {
          db.all(
            `SELECT * FROM order_items WHERE order_id=?`,
            [order.id],
            (err, rawItems) => {
              // Parse measurements JSON on each item
              const items = (rawItems || []).map((item) => ({
                ...item,
                measurements: (() => {
                  try {
                    return JSON.parse(item.measurements || "{}");
                  } catch {
                    return {};
                  }
                })(),
                addTailoringService: item.add_tailoring === 1,

                stitchingType: item.stitching_type || null, // ✅ NEW
                stitchingPrice: item.stitching_price || 0, // ✅ NEW
              }));

              db.get(
                `SELECT * FROM customers WHERE id=?`,
                [order.customer_id],
                (err, customer) => {
                  // FIX: fetch ALL tailoring rows for this order (one per item)
                  db.all(
                    `SELECT * FROM tailoring WHERE order_id=?`,
                    [order.id],
                    (err, tailoringRows) => {
                      const tailoringList = (tailoringRows || []).map((t) => ({
                        ...t,
                        measurements: (() => {
                          try {
                            return JSON.parse(t.measurements || "{}");
                          } catch {
                            return {};
                          }
                        })(),
                      }));

                      resolve({
                        ...order,
                        items,
                        customer: customer || null,
                        // Keep single `tailoring` for backward compat (first row)
                        tailoring: tailoringList[0] || null,
                        // Full list for multi-item tailoring
                        tailoringItems: tailoringList,
                      });
                    },
                  );
                },
              );
            },
          );
        }),
    );

    Promise.all(promises).then((data) => res.json(data));
  });
});

app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run(`DELETE FROM order_items WHERE order_id=?`, [id]);
    db.run(`DELETE FROM tailoring WHERE order_id=?`, [id]);
    db.run(`DELETE FROM orders WHERE id=?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      broadcastOrderUpdate();
      res.json({ success: true });
    });
  });
});

// FIX 6: Status update now also broadcasts so admin sees change live
app.put("/api/orders/:id/status", (req, res) => {
  const { status } = req.body;
  db.run(
    `UPDATE orders SET status=? WHERE id=?`,
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      io.emit("log", `📋 Order #${req.params.id} → ${status}`);
      broadcastOrderUpdate();
      res.json({ success: true });
    },
  );
});

// ================= TAILORING =================

app.put("/api/tailoring/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  db.run(
    `UPDATE orders SET status=? WHERE id=?`,
    [status, orderId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      broadcastOrderUpdate();
      res.json({ success: true });
    },
  );
});

// ================= GET TAILORING JOBS =================

app.get("/api/tailoring/jobs", (req, res) => {
  db.all(`SELECT * FROM tailoring_jobs`, [], (err, jobs) => {
    if (err) return res.status(500).json({ error: err.message });

    const promises = jobs.map(
      (job) =>
        new Promise((resolve) => {
          db.all(
            `SELECT * FROM tailoring_logs WHERE job_id=?`,
            [job.id],
            (err, logs) => {
              db.all(
                `SELECT * FROM tailoring_images WHERE job_id=?`,
                [job.id],
                (err, images) => {
                  resolve({
                    ...job,
                    logs: logs || [],
                    images: images || [],
                  });
                },
              );
            },
          );
        }),
    );

    Promise.all(promises).then((data) => res.json(data));
  });
});

// ================= UPDATE TAILORING STATUS =================

app.put("/api/tailoring/:jobId/status", (req, res) => {
  const { jobId } = req.params;
  const { status, tailor } = req.body;
  db.run(
    `UPDATE tailoring_jobs 
     SET status=?, tailor_name=?, updated_at=? 
     WHERE id=?`,
    [status, tailor, new Date().toISOString(), jobId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        `INSERT INTO tailoring_logs
   VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Date.now().toString() + Math.random(),
          jobId,
          status,
          `Status changed to ${status}`,
          tailor || "System",
          new Date().toISOString(),
        ],
      );

      io.emit("log", `🧵 Job ${jobId} → ${status}`);
      io.emit("tailoring:update");

      res.json({ success: true });
    },
  );
});

app.put("/api/tailoring/:jobId/priority", (req, res) => {
  const { jobId } = req.params;
  const { priority } = req.body;

  db.run(
    `
    UPDATE tailoring_jobs
    SET priority=?, updated_at=?
    WHERE id=?
    `,
    [priority, new Date().toISOString(), jobId],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      io.emit("tailoring:update");

      res.json({
        success: true,
      });
    },
  );
});
// ================= UPLOAD TAILORING IMAGE =================

app.post("/api/tailoring/upload", upload.single("image"), (req, res) => {
  const { jobId, type } = req.body;

  const imagePath = `/uploads/${req.file.filename}`;

  db.run(
    `INSERT INTO tailoring_images (id, job_id, type, url)
     VALUES (?, ?, ?, ?)`,
    [Date.now().toString(), jobId, type, imagePath],
  );

  io.emit("tailoring:update");
  res.json({ url: imagePath });
});

// DELETE TAILORING JOB
app.delete("/api/tailoring/image/:imageId", (req, res) => {
  db.run(
    `DELETE FROM tailoring_images WHERE id=?`,
    [req.params.imageId],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      io.emit("tailoring:update");

      res.json({
        success: true,
      });
    },
  );
});

app.delete("/api/tailoring/:jobId", (req, res) => {
  const { jobId } = req.params;

  db.serialize(() => {
    db.run(`DELETE FROM tailoring_logs WHERE job_id=?`, [jobId]);

    db.run(`DELETE FROM tailoring_images WHERE job_id=?`, [jobId]);

    db.run(`DELETE FROM tailoring_jobs WHERE id=?`, [jobId], function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      io.emit("tailoring:update");

      res.json({
        success: true,
      });
    });
  });
});

app.put("/api/tailoring/:jobId/priority", (req, res) => {
  const { jobId } = req.params;
  const { priority } = req.body;

  db.run(
    `
    UPDATE tailoring_jobs
    SET priority=?, updated_at=?
    WHERE id=?
    `,
    [priority, new Date().toISOString(), jobId],
    function (err) {
      if (err)
        return res.status(500).json({
          error: err.message,
        });

      io.emit("tailoring:update");

      res.json({
        success: true,
      });
    },
  );
});

// ================= INVENTORY =================

app.get("/api/inventory/:productId", (req, res) => {
  db.all(
    `SELECT * FROM inventory WHERE product_id=?`,
    [req.params.productId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/inventory/update", (req, res) => {
  const { productId, inventory } = req.body;
  db.serialize(() => {
    db.run(`DELETE FROM inventory WHERE product_id=?`, [productId]);
    inventory.forEach((item) => {
      db.run(`INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?)`, [
        Date.now().toString() + Math.random(),
        productId,
        item.color,
        item.gsm || "",
        item.stock,
        item.length,
      ]);
    });
    res.json({ success: true });
  });
});

// ================= CLOTH TYPES =================

app.get("/api/cloth-types", (req, res) => {
  db.all(`SELECT * FROM cloth_types`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/cloth-types", (req, res) => {
  const { name } = req.body;
  db.run(
    `INSERT INTO cloth_types VALUES (?, ?)`,
    [Date.now().toString(), name],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    },
  );
});

// ================= CATEGORIES =================

app.post("/api/cloth-types", (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Category name required" });
  }

  const id = Date.now().toString();

  db.run(
    `INSERT INTO cloth_types (id, name) VALUES (?, ?)`,
    [id, name.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      io.emit("log", `🧵 Category "${name}" added`);
      res.json({ success: true, id });
    },
  );
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => res.send("API Running 🚀"));

// ================= START =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
