import { API_URL, imageUrl } from "../config";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Product, TailoringJob } from "../types";
import TailoringProgressBar from "../components/TailoringProgressBar";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";


// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminDashboardProps {
  tailoringJobs: TailoringJob[];
  setTailoringJobs: React.Dispatch<React.SetStateAction<TailoringJob[]>>;
}

interface AnalyticsState {
  totalOrders: number;
  totalRevenue: number;
  tailoringOrders: number;
  topProduct: string;
  avgOrderValue: number;
}

const STATUS_FLOW = ["Order Received", "Cutting", "Stitching", "Completed"];

const TAB_CONFIG = [
  { id: "tailor-unit", label: "Tailor Unit", icon: "fa-scissors" },
  { id: "analytics", label: "Analytics", icon: "fa-chart-line" },
  { id: "inventory", label: "Inventory", icon: "fa-warehouse" },
  { id: "orders", label: "Orders", icon: "fa-box" },
];

// ─── Component ────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tailoringJobs,
  setTailoringJobs,
}) => {
  // ── All state at the top ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("tailor-unit");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalOrders: 0,
    totalRevenue: 0,
    tailoringOrders: 0,
    topProduct: "N/A",
    avgOrderValue: 0,
  });

  // Inventory
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProduct, setNewProduct] = useState<
    Partial<Product> & { imageFiles?: File[] }
  >({
    name: "",
    sku: "",
    pricePerMeter: 0,
    category: "",
    description: "",
    images: [],
  });
  // Tailoring
  const [currentTailor, setCurrentTailor] = useState("Master Ji");
  const [jobPriority, setJobPriority] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const getProductId = (item: any) => {
    return String(item.product_id ?? item.productId ?? item.id);
  };

  // Orders
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  // ── Stable fetch helpers ──────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const text = await res.text();
      try {
        setProducts(JSON.parse(text));
      } catch {
        console.error("Products: invalid JSON");
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setOrders(data);
        return data;
      } catch {
        console.error("Orders: invalid JSON");
        return [];
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
      return [];
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cloth-types`);
      const data = await res.json();
      // server returns [{ id, name }] — extract names
      setCategories(data.map((c: any) => c.name));
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchCategories();
  }, [fetchProducts, fetchOrders, fetchCategories]);

  const fetchTailoringJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tailoring/jobs`);
      const raw = await res.json();

      const formatted = raw.map((job: any) => {
        // 🔹 find order
        const order = orders.find((o) => String(o.id) === String(job.order_id));

        // 🔹 safe items
        const items = Array.isArray(order?.items) ? order.items : [];

        // 🔹 find item
        const item = items.find(
          (i: any) =>
            String(i.product_id ?? i.productId ?? i.id) ===
            String(job.item_product_id),
        );

        const stitchingType =
          item?.stitching_type || item?.stitchingType || null;
        const stitchingPrice =
          item?.stitching_price || item?.stitchingPrice || 0;

        // 🔹 find product
        const product = products.find(
          (p) => String(p.id) === String(job.item_product_id),
        );

        return {
          ...job,
          stitchingType,
          stitchingPrice,
          orderId: job.order_id,
          priority: job.priority || "medium",

          productName: product?.name || "Unknown Product",
          customerName: order?.customer?.name || "Unknown Customer",

          measurements: item?.measurements || {},

          currentStatus:
            job.status && job.status !== "Fabric Sourcing & Inspection"
              ? job.status
              : "Order Received", // ✅ fallback fix

          statusHistory: Array.isArray(job.logs) ? job.logs : [],

          examples: Array.isArray(job.images)
            ? job.images.filter((i: any) => i.type === "before")
            : [],

          finishedProductImage: Array.isArray(job.images)
            ? job.images.find((i: any) => i.type === "after")
            : null,
        };
      });

      setTailoringJobs(formatted);
    } catch (err) {
      console.error("Tailoring fetch error:", err);
    }
  }, [orders, products]);

  useEffect(() => {
    fetchTailoringJobs();
  }, [orders.length, products.length, fetchTailoringJobs]);

  const handleStatusClick = (job: any, status: string) => {
    let currentStatus = job.currentStatus;

    // 🔥 auto-fix invalid status
    if (!STATUS_FLOW.includes(currentStatus)) {
      console.warn("Invalid status detected → fixing");
      currentStatus = "Order Received";
    }

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const clickedIndex = STATUS_FLOW.indexOf(status);

    if (clickedIndex === currentIndex) return;

    if (clickedIndex > currentIndex + 1) {
      alert("Complete previous step first");
      return;
    }

    if (clickedIndex < currentIndex) {
      alert("Cannot go backward");
      return;
    }

    updateJobStatus(job.id, status);
  };

  // ── Compute analytics whenever orders + products change ───────────────────
  useEffect(() => {
    if (orders.length === 0) return;

    let revenue = 0;
    let tailoring = 0;
    const weekly = [0, 0, 0, 0, 0, 0, 0];
    const productCount: Record<string, number> = {};

    orders.forEach((order: any) => {
      const orderTotal = Number(order.total_amount ?? 0);
      if (!isNaN(orderTotal)) {
        revenue += orderTotal;
        const day = new Date(order.created_at || Date.now()).getDay();
        weekly[day] += orderTotal;
      }
      if (order.items?.some((i: any) => i.addTailoringService)) tailoring++;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const product = products.find(
            (p) =>
              String(p.id) ===
              String(item.product_id ?? item.productId ?? item.id),
          );
          const name = product?.name || "Unknown";
          productCount[name] = (productCount[name] || 0) + 1;
        });
      }
    });

    const topProduct =
      Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

    setAnalytics({
      totalOrders: orders.length,
      totalRevenue: revenue,
      tailoringOrders: tailoring,
      topProduct,
      avgOrderValue:
        orders.length > 0 ? Math.floor(revenue / orders.length) : 0,
    });
    setWeeklyData(weekly);
  }, [orders, products]);

  // ── Polling: replaces Socket.io for real-time updates ─────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Logs fetch error:", err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchTailoringJobs();
      fetchLogs();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [fetchOrders, fetchLogs, fetchTailoringJobs]);

  // ── Product helpers ───────────────────────────────────────────────────────
  const updateProductField = (id: string, field: string, value: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const saveProduct = async (product: Product) => {
    setSavingProductId(product.id);
    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (err) {
      console.error(err);
      alert("Save failed ❌");
    } finally {
      setSavingProductId(null);
    }
  };

  const handleAddProduct = async () => {
    try {
      // ✅ VALIDATION FIRST
      if (!newProduct.name?.trim()) {
        return alert("Product name required");
      }

      if (!newProduct.category || newProduct.category.trim() === "") {
        return alert("⚠️ Please select a category");
      }

      const formData = new FormData();

      formData.append("name", newProduct.name);
      formData.append("sku", newProduct.sku || "");
      formData.append("pricePerMeter", String(newProduct.pricePerMeter || 0));
      formData.append("category", String(newProduct.category || "").trim());
      formData.append("description", newProduct.description || "");

      if (newProduct.imageFiles?.[0]) {
        formData.append("image", newProduct.imageFiles[0]);
      }

      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchProducts();

      setShowAddForm(false);
      setNewProduct({
        name: "",
        sku: "",
        pricePerMeter: 0,
        category: "",
        description: "",
        images: [],
      });
    } catch (err: any) {
      console.error("Add product error:", err);
      alert(err?.message || "Failed to add product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  // ── Order helpers ─────────────────────────────────────────────────────────
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await fetch(`${API_URL}/api/orders/${id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert("Delete failed ❌");
    }
  };

  // Fixed: looks up by product_id (DB key) with fallback to productId
  const getProduct = (productId: string) => {
    return products.find((p) => String(p.id) === String(productId));
  };

  // ── Tailoring helpers ─────────────────────────────────────────────────────
  // const updateJobStatus = async (jobId: string, newStatus: string) => {
  //   const job = tailoringJobs.find((j) => j.id === jobId);
  //   if (!job) return;

  //   const currentIndex = STATUS_FLOW.indexOf(job.currentStatus);
  //   const nextIndex = STATUS_FLOW.indexOf(newStatus);

  //   // ❌ prevent skipping
  //   if (nextIndex > currentIndex + 1) {
  //     alert("⚠️ Complete previous step first");
  //     return;
  //   }

  //   // ❌ prevent going backward
  //   if (nextIndex < currentIndex) {
  //     alert("⚠️ Cannot go backwards");
  //     return;
  //   }

  //   await fetch(`${API_URL}/api/tailoring/${jobId}/status`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       status: newStatus,
  //       tailor: currentTailor,
  //     }),
  //   });
  //   await fetchTailoringJobs();
  // };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    const job = tailoringJobs.find((j) => j.id === jobId);

    if (!job) return;

    const currentIndex = STATUS_FLOW.indexOf(job.currentStatus);
    const nextIndex = STATUS_FLOW.indexOf(newStatus);

    if (nextIndex > currentIndex + 1) {
      alert("Complete previous step first");
      return;
    }

    if (nextIndex < currentIndex) {
      alert("Cannot go backward");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/tailoring/${jobId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          tailor: currentTailor,
        }),
      });

      if (!res.ok) {
        throw new Error("Status update failed");
      }

      await fetchTailoringJobs();
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Delete this tailoring job?")) return;

    try {
      const res = await fetch(`${API_URL}/api/tailoring/${jobId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      console.log(data);

      await fetchTailoringJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (jobId: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("jobId", jobId);
    formData.append("type", "before");

    await fetch(`${API_URL}/api/tailoring/upload`, {
      method: "POST",
      body: formData,
    });

    fetchTailoringJobs();
  };

  const handleFinalUpload = async (jobId: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("jobId", jobId);
    formData.append("type", "after");

    await fetch(`${API_URL}/api/tailoring/upload`, {
      method: "POST",
      body: formData,
    });

    fetchTailoringJobs();
  };

  const removeFinalImage = async (jobId: string) => {
    const job = tailoringJobs.find((j) => j.id === jobId);
    const imageId = job?.finishedProductImage?.id;
    if (imageId) {
      try {
        await fetch(`${API_URL}/api/tailoring/image/${imageId}`, {
          method: "DELETE",
        });
        await fetchTailoringJobs();
      } catch (err) {
        console.error("Failed to remove image", err);
      }
    } else {
      // Fallback: update local state if no image ID
      setTailoringJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, finishedProductImage: undefined } : j,
        ),
      );
    }
  };

  // ─── Render: Analytics ────────────────────────────────────────────────────
  const chartData = [
    { day: "Sun", value: weeklyData[0] },
    { day: "Mon", value: weeklyData[1] },
    { day: "Tue", value: weeklyData[2] },
    { day: "Wed", value: weeklyData[3] },
    { day: "Thu", value: weeklyData[4] },
    { day: "Fri", value: weeklyData[5] },
    { day: "Sat", value: weeklyData[6] },
  ];

  const renderAnalytics = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: "Total Orders", value: analytics.totalOrders },
          {
            label: "Revenue",
            value: `₹${analytics.totalRevenue.toLocaleString()}`,
          },
          {
            label: "Avg Order Value",
            value: `₹${analytics.avgOrderValue.toLocaleString()}`,
          },
          { label: "Tailoring Orders", value: analytics.tailoringOrders },
          { label: "Top Product", value: analytics.topProduct, wide: false },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-2xl shadow text-center"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg">
        <h3 className="font-semibold text-lg mb-4">Weekly Revenue</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="#888" />
              <Tooltip
                formatter={(v: any) => `₹${Number(v).toLocaleString()}`}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#1a1a1a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 p-5 rounded-2xl">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Live Activity Log
          </p>
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-green-400 font-mono mb-1">
              &gt; {log}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render: Inventory ────────────────────────────────────────────────────
  const renderInventory = () => {
    const filteredProducts = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between gap-3 md:items-center">
          <h2 className="text-2xl font-bold">
            Inventory
            {loadingProducts && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                Loading…
              </span>
            )}
          </h2>

          <input
            placeholder="Search fabric…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded w-full md:w-64"
          />

          <div className="flex gap-2">
            <input
              placeholder="Add category (Enter)"
              className="border px-3 py-2 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const name = e.currentTarget.value.trim();
                  fetch(`${API_URL}/api/cloth-types`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                  })
                    .then(() => {
                      e.currentTarget.value = "";
                      fetchCategories();
                    })
                    .catch(() => alert("Error adding category"));
                }
              }}
            />
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-black text-white px-4 py-2 rounded whitespace-nowrap"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="bg-white p-5 rounded-xl shadow border space-y-3">
            <h3 className="font-bold">Add New Fabric</h3>
            <input
              placeholder="Product Name *"
              value={newProduct.name || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="SKU"
              value={newProduct.sku || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, sku: e.target.value })
              }
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Price per meter"
              type="number"
              min={0}
              value={newProduct.pricePerMeter || ""}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  pricePerMeter: Number(e.target.value),
                })
              }
              className="border p-2 w-full rounded"
            />
            <select
              value={newProduct.category || ""}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="border p-2 w-full rounded"
            >
              <option value="">Select Category</option>
              {categories.map((c, i) => (
                <option key={c + i} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Short description"
              value={newProduct.description || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              className="border p-2 w-full rounded"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  imageFiles: e.target.files ? Array.from(e.target.files) : [],
                })
              }
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddProduct}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products grid */}
        {filteredProducts.length === 0 && !loadingProducts && (
          <p className="text-gray-400 text-center py-12">No products found.</p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl shadow border">
              <img
                src={
                  p.image
                    ? imageUrl(p.image)
                    : "https://placehold.co/400x200?text=No+Image"
                }
                className="w-full h-40 object-cover rounded-xl mb-3"
                alt={p.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x200?text=No+Image";
                }}
              />

              <input
                value={p.name}
                onChange={(e) =>
                  updateProductField(p.id, "name", e.target.value)
                }
                className="font-bold text-lg w-full mb-1 border-b border-transparent focus:border-gray-300 outline-none"
              />

              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm text-gray-500">₹</span>
                <input
                  type="number"
                  value={p.pricePerMeter}
                  min={0}
                  onChange={(e) =>
                    updateProductField(
                      p.id,
                      "pricePerMeter",
                      Number(e.target.value),
                    )
                  }
                  className="text-sm w-full border-b border-transparent focus:border-gray-300 outline-none"
                />
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  /m
                </span>
              </div>

              <select
                value={p.category || ""}
                onChange={(e) =>
                  updateProductField(p.id, "category", e.target.value)
                }
                className="border p-2 w-full rounded mb-2 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <textarea
                value={p.description || ""}
                onChange={(e) =>
                  updateProductField(p.id, "description", e.target.value)
                }
                className="text-xs w-full mb-3 border p-2 rounded resize-none h-16"
                placeholder="Description…"
              />

              <button
                onClick={() => saveProduct(p)}
                disabled={savingProductId === p.id}
                className="w-full bg-black text-white py-2 rounded disabled:opacity-50 mb-2"
              >
                {savingProductId === p.id ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => handleDeleteProduct(p.id)}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Render: Tailoring ────────────────────────────────────────────────────
  const renderTailoring = () => {
    const filteredJobs =
      filterStatus === "All"
        ? tailoringJobs
        : tailoringJobs.filter((job) => job.currentStatus === filterStatus);

    return (
      <div className="space-y-8">
        {/* Overview bar */}
        <div className="bg-white p-6 rounded-2xl shadow border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">Tailor Unit Hub</h2>
            <p className="text-sm text-gray-500 mt-1">
              Active tailor:{" "}
              <input
                value={currentTailor}
                onChange={(e) => setCurrentTailor(e.target.value)}
                className="border-b border-gray-300 outline-none text-sm font-semibold w-32"
              />
            </p>
          </div>
          <div className="flex gap-6 text-sm flex-wrap">
            <span>
              All: <b>{tailoringJobs.length}</b>
            </span>

            <span className="text-blue-600">
              Order Received:
              <b>
                {
                  tailoringJobs.filter(
                    (j) => j.currentStatus === "Order Received",
                  ).length
                }
              </b>
            </span>

            <span className="text-orange-500">
              Cutting:
              <b>
                {
                  tailoringJobs.filter((j) => j.currentStatus === "Cutting")
                    .length
                }
              </b>
            </span>

            <span className="text-purple-600">
              Stitching:
              <b>
                {
                  tailoringJobs.filter((j) => j.currentStatus === "Stitching")
                    .length
                }
              </b>
            </span>

            <span className="text-green-600">
              Completed:
              <b>
                {
                  tailoringJobs.filter((j) => j.currentStatus === "Completed")
                    .length
                }
              </b>
            </span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {["All", "Order Received", "Cutting", "Stitching", "Completed"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  filterStatus === f
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ),
          )}
        </div>

        {/* Job cards */}
        {filteredJobs.length === 0 && (
          <p className="text-gray-400 text-center py-12">
            No tailoring jobs match this filter.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const isCompleted = job.currentStatus === "Completed";

            const isStitching = job.currentStatus === "Stitching";

            return (
              <div
                key={job.id}
                className={`p-6 rounded-2xl border shadow-sm transition-all

  ${
    job.currentStatus === "Completed"
      ? "bg-green-50 border-green-400 border-2"
      : job.currentStatus === "Stitching"
        ? "bg-purple-50 border-purple-400 border-2"
        : job.currentStatus === "Cutting"
          ? "bg-orange-50 border-orange-400 border-2"
          : job.priority === "high"
            ? "bg-red-50 border-red-400 border-2"
            : "bg-blue-50 border-blue-400 border-2"
  }
`}
              >
                {/* Job header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {job.productName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Order <span className="font-mono">#{job.orderId}</span> ·{" "}
                      {job.customerName}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold

  ${
    job.currentStatus === "Completed"
      ? "bg-green-100 text-green-700"
      : job.currentStatus === "Stitching"
        ? "bg-purple-100 text-purple-700"
        : job.currentStatus === "Cutting"
          ? "bg-orange-100 text-orange-700"
          : "bg-blue-100 text-blue-700"
  }
`}
                  >
                    {job.currentStatus}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold

    ${
      job.priority === "high"
        ? "bg-red-100 text-red-700"
        : job.priority === "medium"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
    }
  `}
                    >
                      {job.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Measurements */}
                {job.stitchingType && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                      Stitching Type
                    </p>
                    <p className="text-sm font-bold text-blue-900">
                      ✂ {job.stitchingType}
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      ₹{job.stitchingPrice}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    ["Chest", job.measurements?.chest],
                    ["Waist", job.measurements?.waist],
                    ["Shoulder", job.measurements?.shoulder],
                    ["Length", job.measurements?.length],
                  ].map(([label, val]) => (
                    <div
                      key={label as string}
                      className="bg-gray-50 rounded-xl p-2 text-center"
                    >
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                        {label}
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {val || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <TailoringProgressBar
                    currentStatus={job.currentStatus}
                    onStatusChange={(s) => handleStatusClick(job, s)}
                  />
                </div>

                {/* Photo uploads */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">
                      Before
                    </p>
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(job.id, e)}
                      />
                      <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center hover:border-gray-400 transition overflow-hidden">
                        {job.examples && job.examples.length > 0 ? (
                          <img
                            src={imageUrl(job.examples[0].url)}
                            className="w-full h-full object-cover"
                            alt="Before"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            + Upload
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">
                      After
                    </p>
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFinalUpload(job.id, e)}
                      />
                      <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center hover:border-gray-400 transition overflow-hidden">
                        {job.finishedProductImage ? (
                          <img
                            src={imageUrl(job.finishedProductImage.url)}
                            className="w-full h-full object-cover"
                            alt="After"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            + Upload
                          </span>
                        )}
                      </div>
                    </label>
                    {job.finishedProductImage && (
                      <button
                        onClick={() => removeFinalImage(job.id)}
                        className="text-xs text-red-400 hover:text-red-600 mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <select
                    value={job.priority || "medium"}
                    onChange={async (e) => {
                      const priority = e.target.value;

                      try {
                        const res = await fetch(
                          `${API_URL}/api/tailoring/${job.id}/priority`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              priority,
                            }),
                          },
                        );

                        if (!res.ok) {
                          throw new Error("Failed");
                        }

                        fetchTailoringJobs();
                      } catch (err) {
                        console.error(err);
                        alert("Priority update failed");
                      }
                    }}
                    className={`border px-3 py-1 rounded text-xs font-semibold

  ${
    job.priority === "high"
      ? "bg-red-100 text-red-700 border-red-300"
      : job.priority === "medium"
        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
        : "bg-green-100 text-green-700 border-green-300"
  }
`}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedJobId(job.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Details →
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail modal */}
        {selectedJobId &&
          (() => {
            const job = tailoringJobs.find((j) => j.id === selectedJobId);
            if (!job) return null;
            return (
              <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
                <div
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setSelectedJobId(null)}
                />
                <div
                  className="relative bg-white w-[380px] rounded-2xl shadow-2xl border p-6 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-base">{job.productName}</h2>
                    <button
                      onClick={() => setSelectedJobId(null)}
                      className="text-gray-400 hover:text-black text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1 text-sm mb-4">
                    {job.stitchingType && (
                      <p className="text-sm">
                        <b>Stitching:</b> {job.stitchingType} (₹
                        {job.stitchingPrice})
                      </p>
                    )}
                    <p>
                      <b>Order:</b> #{job.orderId}
                    </p>
                    <p>
                      <b>Customer:</b> {job.customerName}
                    </p>
                    <p>
                      <b>Status:</b>{" "}
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {job.currentStatus}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <p>Chest: {job.measurements?.chest || "—"}</p>
                    <p>Waist: {job.measurements?.waist || "—"}</p>
                    <p>Shoulder: {job.measurements?.shoulder || "—"}</p>
                    <p>Length: {job.measurements?.length || "—"}</p>
                  </div>

                  {/* Quick status buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusClick(job, s)}
                        className={`text-xs px-3 py-1 rounded border

${
  job.currentStatus === s
    ? s === "Completed"
      ? "bg-green-600 text-white border-green-600"
      : s === "Stitching"
        ? "bg-purple-600 text-white border-purple-600"
        : s === "Cutting"
          ? "bg-orange-600 text-white border-orange-600"
          : "bg-blue-600 text-white border-blue-600"
    : "border-gray-300 hover:bg-gray-100"
}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {job.examples?.[0] && (
                      <img
                        src={imageUrl(job.examples[0].url)}
                        className="h-24 w-full object-cover rounded-lg"
                        alt="Before"
                      />
                    )}
                    {job.finishedProductImage && (
                      <img
                        src={imageUrl(job.finishedProductImage.url)}
                        className="h-24 w-full object-cover rounded-lg"
                        alt="After"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    );
  };

  // ─── Render: Orders ───────────────────────────────────────────────────────
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Orders
          {loadingOrders && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              Loading…
            </span>
          )}
        </h2>
        <button
          onClick={() => fetchOrders()}
          className="text-sm text-gray-500 hover:text-black border px-3 py-1.5 rounded"
        >
          ↻ Refresh
        </button>
      </div>

      {orders.length === 0 && !loadingOrders && (
        <p className="text-gray-400 text-center py-12">No orders yet.</p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="relative bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <button
              onClick={() => handleDeleteOrder(order.id)}
              className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition text-lg leading-none"
              title="Delete order"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-box-open text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {order.customer?.name || "Customer"}
                </p>
                <p className="text-xs font-mono text-gray-400">#{order.id}</p>
                <p className="text-xs text-gray-400">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 ml-auto">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Status
                </p>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                    order.status === "Delivered" ||
                    order.status === "Dispatched"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {order.status || "Pending"}
                </span>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Total
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹
                  {(
                    order.items?.reduce(
                      (acc: number, item: any) =>
                        acc +
                        Number(item.price ?? 0) * Number(item.quantity ?? 1),
                      0,
                    ) ?? 0
                  ).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(order)}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-xs"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div
            className="relative bg-white w-[420px] max-h-[80vh] overflow-y-auto p-6 rounded-2xl shadow-2xl border z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base">Order #{selectedOrder.id}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Customer */}
            <div className="text-sm space-y-1 mb-4 bg-gray-50 p-3 rounded-xl">
              <p>
                <b>Name:</b> {selectedOrder.customer?.name || "—"}
              </p>
              <p>
                <b>Phone:</b> {selectedOrder.customer?.phone || "—"}
              </p>
              <p>
                <b>Email:</b> {selectedOrder.customer?.email || "—"}
              </p>
              <p>
                <b>Address:</b> {selectedOrder.customer?.address || "—"}
              </p>
            </div>

            {/* Items */}
            <p className="font-semibold text-sm mb-2">Items</p>
            {selectedOrder.items?.length > 0 ? (
              selectedOrder.items.map((item: any, i: number) => {
                // Fix: server stores product_id, not productId
                const product = getProduct(
                  String(item.product_id ?? item.productId ?? ""),
                );
                return (
                  <div key={i} className="border rounded-xl p-3 mb-2 text-sm">
                    <p className="font-bold">
                      {product?.name || item.product_name || "Unknown Product"}
                    </p>
                    <p className="text-gray-500">
                      Qty: {item.quantity} · ₹{item.price}
                    </p>
                    {item.addTailoringService && item.measurements && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <p className="font-semibold mb-1">Measurements:</p>
                        <div className="grid grid-cols-2 gap-1">
                          <p>Chest: {item.measurements.chest || "—"}</p>
                          <p>Waist: {item.measurements.waist || "—"}</p>
                          <p>Shoulder: {item.measurements.shoulder || "—"}</p>
                          <p>Length: {item.measurements.length || "—"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No items found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="mb-12 border-b border-brand-silver/30 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em]">
                System Registry
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-earth tracking-tighter mt-2">
                ADMIN{" "}
                <span className="italic font-normal text-brand-earth/50">
                  CONSOLE
                </span>
              </h1>
              <p className="text-[11px] font-bold text-brand-earth/40 uppercase tracking-[0.4em] mt-1">
                Junction Enterprise Portal v2.0
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[9px] font-black text-brand-earth/30 uppercase tracking-widest mb-1">
                  Registry Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-brand-earth uppercase tracking-widest">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-3 mb-8 border-b border-brand-silver/20 pb-6">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold uppercase tracking-widest text-[10px] border ${
                activeTab === tab.id
                  ? "bg-brand-earth text-brand-gold border-brand-earth shadow-lg"
                  : "bg-white text-brand-earth/40 border-brand-silver/20 hover:bg-brand-gold/10 hover:text-brand-earth"
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-brand-silver/30 min-h-[600px] p-8 md:p-12">
          {activeTab === "analytics" && renderAnalytics()}
          {activeTab === "inventory" && renderInventory()}
          {activeTab === "tailor-unit" && renderTailoring()}
          {activeTab === "orders" && renderOrders()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
