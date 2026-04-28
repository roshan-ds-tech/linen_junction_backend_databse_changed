const API_URL = import.meta.env.VITE_API_URL;
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Product, TailoringJob } from "../types";
import TailoringProgressBar from "../components/TailoringProgressBar";
const socket = io(API_URL || "hhttps://linen-backend.onrender.com");

interface AdminDashboardProps {
  tailoringJobs: TailoringJob[];
  setTailoringJobs: React.Dispatch<React.SetStateAction<TailoringJob[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tailoringJobs,
  setTailoringJobs,
}) => {
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    tailoringOrders: 0,
    topProduct: "",
    avgOrderValue: 0,
  });

  useEffect(() => {
    if (products.length === 0) return; // 🔥 WAIT

    const loadAnalytics = async () => {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json().catch(() => []);

      let revenue = 0;
      let tailoring = 0;
      const productCount: any = {};

      data.forEach((order: any) => {
        (order.items || []).forEach((item: any) => {
          console.log("ITEM:", item);
          console.log("PRODUCTS:", products);
          const price =
            (item.discountPrice || item.pricePerMeter) *
              item.selectedMeters *
              item.quantity +
            (item.addTailoringService ? 2500 : 0);

          revenue += price;

          if (item.addTailoringService) tailoring++;

          const product = getProduct(item.product_id || item.id);
          const name = product?.name || "Unknown";

          productCount[name] = (productCount[name] || 0) + 1;
        });
      });

      const topProduct =
        Object.keys(productCount).sort(
          (a, b) => productCount[b] - productCount[a],
        )[0] || "N/A";

      setAnalytics({
        totalOrders: data.length,
        totalRevenue: revenue,
        tailoringOrders: tailoring,
        topProduct,
        avgOrderValue: data.length ? Math.floor(revenue / data.length) : 0,
      });
    };

    loadAnalytics();
  }, []);
  const [activeTab, setActiveTab] = useState("tailor-unit");
  const [logs, setLogs] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const getProduct = (id: string) => {
    return products.find((p) => p.id === id);
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentTailor, setCurrentTailor] = useState("Master Ji");
  const [jobPriority, setJobPriority] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product>({
    id: "",
    name: "",
    sku: "",
    pricePerMeter: 0,
    category: "",
    image: "",
    images: [],
    inventory: [],
  });
  const [inventory, setInventory] = useState<any[]>([]);
  const [clothFilter, setClothFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newProduct, setNewProduct] = useState<
    Partial<Product> & { imageFiles?: File[] }
  >({
    name: "",
    sku: "",
    pricePerMeter: 0,
    category: "Pure Linen",
    description: "",
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800",
    ],
  });
  const [filterStatus, setFilterStatus] = useState("All");
  const handleDeleteJob = async (id: string) => {
    const orderId = id.split("-")[0];

    const confirmDelete = window.confirm("Delete full order?");
    if (!confirmDelete) return;

    try {
      await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: "DELETE",
      });

      setTailoringJobs((prev) => prev.filter((job) => job.id !== id));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        const text = await res.text();
        let data = [];

        try {
          data = JSON.parse(text);
        } catch {
          console.error("Invalid JSON response");
        }

        console.log("Orders:", data);
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders ❌", err);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        console.log("DB PRODUCTS:", data);
        setProducts(data);
      });
  }, []);

  const handleAddProduct = async () => {
    try {
      const formData = new FormData();

      formData.append("name", newProduct.name || "");
      formData.append("sku", newProduct.sku || "");
      formData.append("pricePerMeter", String(newProduct.pricePerMeter || 0));
      formData.append("category", "Pure Linen");
      formData.append("description", newProduct.description || "");

      if (newProduct.imageFiles?.[0]) {
        formData.append("image", newProduct.imageFiles[0]);
      }

      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data = [];

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to add product");
      }

      alert("✅ Product added successfully");

      await fetchProducts(); // refresh UI
      setShowAddForm(false);
    } catch (err: any) {
      console.error("ADD PRODUCT ERROR:", err);
      alert("❌ " + err.message);
    }
  };

  const STATUS_FLOW = [
    "Fabric Sourcing & Inspection",
    "Pattern Cutting",
    "Stitching & Assembly",
    "Finishing & Quality Check",
    "Dispatched",
  ];

  // const handleUpdateProduct = async () => {
  //   if (!selectedProduct) return;

  //   try {
  //     console.log("REAL ID:", selectedProduct.id);

  //     const res = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         name: selectedProduct.name,
  //         sku: selectedProduct.sku,
  //         pricePerMeter: Number(selectedProduct.pricePerMeter),
  //         category: selectedProduct.category,
  //         description: selectedProduct.description,
  //       }),
  //     });

  //     if (!res.ok) {
  //       const text = await res.text();
  //       console.error("Server says:", text);
  //       throw new Error("Update failed");
  //     }

  //

  //     alert("Updated ✅");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Update failed ❌");
  //   }
  // };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      const res = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          pricePerMeter: Number(selectedProduct.pricePerMeter),
          category: selectedProduct.category,
          description: selectedProduct.description,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      alert("Updated ✅");

      await fetchProducts(); // 🔥 IMPORTANT: refresh from DB
    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }
  };

  const updateJobStatus = (jobId: string, status: string, note: string) => {
    setTailoringJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const currentIndex = STATUS_FLOW.indexOf(job.currentStatus);
          const nextIndex = STATUS_FLOW.indexOf(status);

          // ❌ Prevent skipping steps
          if (nextIndex > currentIndex + 1) {
            alert("⚠️ Complete previous step first!");
            return job;
          }

          // ❌ Prevent going backwards
          if (nextIndex < currentIndex) {
            alert("⚠️ Cannot go backwards!");
            return job;
          }

          const update = {
            status,
            timestamp: new Date().toISOString(),
            note: `${status} completed by ${currentTailor}`,
            tailor: currentTailor,
          };

          return {
            ...job,
            currentStatus: status,
            statusHistory: [...job.statusHistory, update],
          };
        }
        return job;
      }),
    );

    // ✅ OUTSIDE setState (VERY IMPORTANT)
    const priority = jobPriority[jobId] || "medium";

    socket.emit(
      "log",
      `🧵 Job ${jobId} → ${status} by ${currentTailor} [${priority}]`,
    );

    const orderId = jobId.split("-")[0];

    fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
  };

  // const handleFileUpload = (
  //   jobId: string,
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   ) => {
  //   const file = e.target.files?.[0];

  //   if (!file) return;

  //   const reader = new FileReader();

  //   reader.onloadend = () => {
  //     const newPhoto = {
  //       url: reader.result as string,
  //       capturedAt: new Date().toLocaleString(),
  //       capturedBy: currentTailor,
  //     };

  //     setTailoringJobs((prev) =>
  //       prev.map((job) =>
  //         job.id === jobId
  //           ? { ...job, examples: [...(job.examples || []), newPhoto] }
  //           : job,
  //       ),
  //     );

  //     socket.emit("log", `📸 Progress photo added for Job ${jobId}`);
  //   };

  //   reader.readAsDataURL(file);
  // };

  const handleFileUpload = (
    jobId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const newPhoto = {
        url: reader.result as string,
        capturedAt: new Date().toLocaleString(),
        capturedBy: currentTailor,
      };

      setTailoringJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, examples: [...(job.examples || []), newPhoto] }
            : job,
        ),
      );
    };

    reader.readAsDataURL(file);
  };

  const handleFinalUpload = (
    jobId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const job = tailoringJobs.find((j) => j.id === jobId);

    if (job?.currentStatus !== "Dispatched") {
      alert("⚠️ Complete all steps before uploading final result");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const finalPhoto = {
          url: reader.result as string,
          capturedAt: new Date().toLocaleString(),
          capturedBy: currentTailor,
          customerDetails: "Verified Order",
          tailorDetails: "Quality Checked",
        };
        setTailoringJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, finishedProductImage: finalPhoto }
              : job,
          ),
        );
      };
      reader.readAsDataURL(file);
    }
    socket.emit("log", `✅ Final product uploaded for Job ${jobId}`);
  };

  const removeFinalImage = (jobId: string) => {
    setTailoringJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, finishedProductImage: undefined } : job,
      ),
    );
  };

  useEffect(() => {
    socket.on("log", (msg) => {
      setLogs((prev) => [msg, ...prev.slice(0, 9)]);
    });

    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        const text = await res.text();
        let data = [];

        try {
          data = JSON.parse(text);
        } catch {
          console.error("Invalid JSON response");
        }

        setTailoringJobs(
          data
            .filter((order: any) => order.tailoring)
            .flatMap((order: any) =>
              (order.items || []).map((item: any) => {
                const product = products.find(
                  (p) => String(p.id) === String(item.product_id || item.id),
                );

                return {
                  id: order.id + "-" + item.product_id,
                  orderId: order.id,
                  customerName: order.customer?.name || "Customer",

                  // ✅ FIXED
                  productName:
                    product?.name ||
                    item.product_name ||
                    item.name ||
                    "Unknown Product",

                  productImage: product?.image
                    ? `${API_URL}${product.image}`
                    : "",

                  measurements: order.tailoring?.measurements || {},

                  currentStatus: order.status || "Fabric Sourcing & Inspection",
                  statusHistory: [],
                  examples: [],
                };
              }),
            ),
        );
      } catch (err) {
        console.error("Failed to sync jobs");
      }
    };

    fetchJobs();

    return () => {
      socket.off("analytics");
      socket.off("log");
    };
  }, [products]); // ✅ THIS IS THE KEY FIX

  const renderAnalytics = () => (
    <div className="space-y-10 animate-fadeIn text-center">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-brand-white p-10 rounded-[40px] border-4 border-brand-mint shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-mint/20 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-money-bill-trend-up text-brand-earth text-4xl"></i>
          </div>
          <p className="text-sm font-black text-brand-earth/60 uppercase tracking-widest mb-2">
            Total Orders
          </p>
          <h4 className="text-4xl font-serif font-bold text-brand-earth">
            {analytics.totalOrders}
          </h4>
          <div className="mt-6 w-full bg-brand-silver/30 h-4 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-[75%]"></div>
          </div>
          <p className="text-xs font-bold text-green-600 mt-3">
            Doing Great! 👍
          </p>
        </div>

        {/* <div className="bg-brand-white p-10 rounded-[40px] border-4 border-brand-gold shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-gold/20 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-boxes-stacked text-brand-earth text-4xl"></i>
          </div>
          <p className="text-sm font-black text-brand-earth/60 uppercase tracking-widest mb-2">
            Cloth in Stock
          </p>
          <h4 className="text-4xl font-serif font-bold text-brand-earth">
            {analytics.users * 10} m
          </h4>
          <div className="mt-6 w-full bg-brand-silver/30 h-4 rounded-full overflow-hidden">
            <div className="bg-brand-gold h-full w-[60%]"></div>
          </div>
          <p className="text-xs font-bold text-brand-earth/60 mt-3">
            Plenty of Fabric
          </p>
        </div> */}

        <div className="bg-brand-white p-10 rounded-[40px] border-4 border-brand-earth shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-earth/20 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-person-digging text-brand-earth text-4xl"></i>
          </div>
          <p className="text-sm font-black text-brand-earth/60 uppercase tracking-widest mb-2">
            Revenue
          </p>
          <h4 className="text-4xl font-serif font-bold text-brand-earth">
            Rs.{analytics.totalRevenue.toLocaleString()}
          </h4>
          <div className="mt-6 w-full bg-brand-silver/30 h-4 rounded-full overflow-hidden">
            <div className="bg-brand-earth h-full w-[40%]"></div>
          </div>
          <p className="text-xs font-bold text-brand-earth/60 mt-3">
            Busy Workshop
          </p>
        </div>

        <div className="bg-brand-white p-10 rounded-[40px] border-4 border-brand-gold shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-gold/20 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-scissors text-brand-earth text-4xl"></i>
          </div>
          <p className="text-sm font-black text-brand-earth/60 uppercase tracking-widest mb-2">
            Tailoring Orders
          </p>
          <h4 className="text-4xl font-serif font-bold text-brand-earth">
            {analytics.tailoringOrders}
          </h4>
          <div className="mt-6 w-full bg-brand-silver/30 h-4 rounded-full overflow-hidden">
            <div className="bg-brand-gold h-full w-[60%]"></div>
          </div>
          <p className="text-xs font-bold text-brand-earth/60 mt-3">
            Custom Demand
          </p>
        </div>

        <div className="bg-brand-white p-10 rounded-[40px] border-4 border-brand-mint shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-mint/20 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-star text-brand-earth text-4xl"></i>
          </div>
          <p className="text-sm font-black text-brand-earth/60 uppercase tracking-widest mb-2">
            Top Product
          </p>
          <h4 className="text-xl font-serif font-bold text-brand-earth text-center">
            {analytics.topProduct}
          </h4>
          <div className="mt-6 w-full bg-brand-silver/30 h-4 rounded-full overflow-hidden">
            <div className="bg-brand-mint h-full w-[80%]"></div>
          </div>
          <p className="text-xs font-bold text-green-600 mt-3">
            Best Seller 🔥
          </p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border-2 border-brand-silver shadow-lg overflow-hidden">
        <h3 className="text-2xl font-serif font-bold text-brand-earth mb-8">
          Weekly Sales Graph
        </h3>
        <div className="overflow-x-auto pb-4 custom-scroll">
          <div className="h-80 flex items-end gap-6 px-4 min-w-[600px] md:min-w-0">
            {weeklyData.length
              ? weeklyData
              : [0, 0, 0, 0, 0, 0, 0].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span className="text-sm font-black text-brand-earth mb-1">
                      ₹{val * 100}
                    </span>
                    <div
                      className={`w-full rounded-t-2xl transition-all duration-500 ${i % 2 === 0 ? "bg-brand-mint" : "bg-brand-gold"}`}
                      style={{ height: `${val * 2}px` }}
                    ></div>
                    <span className="text-xs font-bold text-brand-earth/40 uppercase mt-2">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );

  // const renderInventory = () => (
  //   <div className="space-y-10 animate-fadeIn">
  //     <h2 className="text-3xl font-serif font-bold text-brand-earth">
  //       Inventory Management
  //     </h2>
  //     <button
  //       onClick={() => setShowAddForm(true)}
  //       className="bg-green-600 text-white px-4 py-2 mb-6"
  //     >
  //       Add Product
  //     </button>
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  //       {products.map((p) => (
  //         <div key={p.id} className="bg-white p-6 rounded-3xl border shadow">
  //           <img
  //             src={p.images[0]}
  //             className="w-full h-40 object-cover rounded-xl mb-4"
  //           />

  //           <h3 className="font-bold text-lg">{p.name}</h3>

  //           <h3 className="text-2xl font-serif font-bold text-brand-earth mb-2">
  //             {p.name}
  //           </h3>

  //           <p className="text-sm font-bold text-brand-earth/40 uppercase mb-4">
  //             {p.category}
  //           </p>

  //           <div className="flex justify-between items-center bg-brand-silver/10 p-4 rounded-2xl">
  //             <div>
  //               <p className="text-[10px] font-black text-brand-earth/30 uppercase">
  //                 Total Stock
  //               </p>
  //               <p className="text-xl font-bold text-brand-earth">
  //                 {p.inventory?.reduce((sum, i) => sum + i.stock, 0)} M
  //               </p>
  //             </div>
  //           </div>

  //           <button
  //             onClick={() => {
  //               setSelectedProduct(p);
  //               setInventory(
  //                 p.inventory && p.inventory.length > 0
  //                   ? p.inventory
  //                   : [{ color: "Default", length: 1, stock: 0 }],
  //               );
  //             }}
  //             className="mt-4 w-full bg-brand-earth text-brand-gold py-3 rounded-xl font-bold uppercase tracking-widest"
  //           >
  //             Edit Inventory
  //           </button>
  //         </div>
  //       ))}
  //     </div>

  //     {/* EDITOR */}
  //     {(selectedProduct || products[0]) && (
  //       <div className="mt-10 bg-gray-50 p-6 rounded-xl">
  //         <h3 className="text-xl font-bold mb-4">
  //           Editing: {(selectedProduct || products[0])?.name}
  //         </h3>

  //         {inventory.map((item, index) => (
  //           <div key={index} className="flex gap-4 mb-3">
  //             <input value={item.color} readOnly className="border p-2 w-1/3" />

  //             <input
  //               value={item.length}
  //               readOnly
  //               className="border p-2 w-1/3"
  //             />

  //             <input
  //               type="number"
  //               value={item.stock}
  //               onChange={(e) => {
  //                 const updated = [...inventory];
  //                 updated[index].stock = Number(e.target.value);
  //                 setInventory(updated);
  //               }}
  //               className="border p-2 w-1/3"
  //             />
  //           </div>
  //         ))}

  //         <button
  //           onClick={handleSaveInventory}
  //           className="bg-green-600 text-white px-4 py-2 mt-4 rounded"
  //         >
  //           Save Inventory
  //         </button>
  //       </div>
  //     )}
  //   </div>
  // );

  // const handleSaveInventory = async () => {
  //   await fetch("${API_URL}/api/inventory/update", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       productId: selectedProduct?.id,
  //       inventory,
  //     }),
  //   });

  //   // 🔥 update UI instantly
  //   setProducts((prev) =>
  //     prev.map((p) => (p.id === selectedProduct?.id ? { ...p, inventory } : p)),
  //   );

  //   setSelectedProduct(null);
  // };

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct({ ...p }); // 🔥 clone it
  };

  const handleSaveInventory = async () => {
    if (!selectedProduct) {
      alert("No product selected");
      return;
    }

    try {
      await fetch(`${API_URL}/api/inventory/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          inventory,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, inventory } : p,
        ),
      );

      alert("Saved ✅");
    } catch {
      alert("Backend error ❌");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmDelete = window.confirm("Delete this product permanently?");
    if (!confirmDelete) return;

    try {
      await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
      });

      // 🔥 Update UI instantly
      setProducts((prev) => prev.filter((p) => p.id !== id));

      // 🔥 Reset selection if deleted
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setInventory([]);
      }

      alert("Product deleted ✅");
    } catch (err) {
      alert("Delete failed ❌");
    }
    await fetchProducts();
  };

  const handleDeleteOrder = async (id: string) => {
    const confirmDelete = window.confirm("Delete this order permanently?");
    if (!confirmDelete) return;

    try {
      await fetch(`${API_URL}/api/orders/${id}`, {
        method: "DELETE",
      });

      // 🔥 update UI instantly
      setOrders((prev) => prev.filter((o) => o.id !== id));

      alert("Order deleted ✅");
    } catch (err) {
      alert("Delete failed ❌");
    }
  };

  const fetchProducts = async () => {
    const res = await fetch(`${API_URL}/api/products`);
    const text = await res.text();
    let data = [];

    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON response");
    }
    setProducts(data);
  };

  const renderInventory = () => {
    const filteredProducts = products
      .filter((p) =>
        clothFilter === "All" ? true : p.category === clothFilter,
      )
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* 🔥 HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-serif font-bold text-brand-earth">
            Inventory
          </h2>

          <button
            onClick={() => setShowAddForm(true)}
            className="bg-brand-earth text-brand-gold px-5 py-2 rounded-xl font-bold shadow hover:scale-105 transition"
          >
            + Add Product
          </button>
        </div>

        {/* 🔍 SEARCH + FILTER */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search fabrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-4 py-2 rounded-xl w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />

          {/* FILTER CHIPS */}
          <div className="flex gap-2 flex-wrap">
            {["All", "Cotton", "Linen", "Silk", "Denim", "Polyester"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setClothFilter(type)}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition ${
                    clothFilter === type
                      ? "bg-brand-earth text-brand-gold"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white p-5 rounded-xl shadow border space-y-3">
            <h3 className="font-bold">Add New Fabric</h3>
            
            <input
              placeholder="Product Name"
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="border p-2 w-full"
            />

            <input
              placeholder="Price per meter"
              type="number"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  pricePerMeter: Number(e.target.value),
                })
              }
              className="border p-2 w-full"
            />

            <select
  value={newProduct.category || ""}
  onChange={(e) =>
    setNewProduct({ ...newProduct, category: e.target.value })
  }
  className="border p-2 w-full"
>
  <option value="">Select Category</option>

  {categories.length === 0 ? (
    <option disabled>Loading...</option>
  ) : (
    categories.map((cat, i) => (
      <option key={i} value={cat}>
        {cat}
      </option>
    ))
  )}
</select>

            <input
              placeholder="Add new category"
              className="border p-2 w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetch(`${API_URL}/api/cloth-types`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: e.currentTarget.value }),
                  }).then(() => {
                    alert("Category added ✅");
                    window.location.reload();
                  });
                }
              }}
            />

            <textarea
              placeholder="Short description (e.g. soft, breathable linen for summer wear)"
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              className="border p-2 w-full rounded"
              rows={2}
            />

            <input
              placeholder="Total Length (meters)"
              type="number"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  totalLength: Number(e.target.value),
                })
              }
              className="border p-2 w-full"
            />

            <input
              type="file"
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl shadow border">
              <img
                src={p.image ? `${API_URL}${p.image}` : ""}
                className="w-full h-40 object-cover rounded-xl mb-3"
              />

              {/* EDITABLE FIELDS */}
              <input
                value={p.name}
                onChange={(e) =>
                  updateProductField(p.id, "name", e.target.value)
                }
                className="font-bold text-lg w-full mb-1"
              />

                <input
                  type="number"
                  value={selectedProduct.pricePerMeter}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      pricePerMeter: Number(e.target.value),
                    })
                  }
                  className="border p-2 w-full mb-3"
                />

                <select
                  value={selectedProduct.category || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      category: e.target.value,
                    })
                  }
                  className="border p-2 w-full mb-3"
                >
                  <option>Cotton</option>
                  <option>Linen</option>
                  <option>Silk</option>
                  <option>Denim</option>
                  <option>Polyester</option>
                </select>

                <textarea
                  value={selectedProduct.description}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      description: e.target.value,
                    })
                  }
                  className="border p-2 w-full mb-3"
                />

                <button
                  onClick={handleUpdateProduct}
                  className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl font-bold"
                >
                  Update Product
                </button>
              </>
            ) : (
              <div className="text-center text-gray-400 mt-20">
                Select a product to edit inventory
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // const renderTailoring = () => (

  //   <div className="space-y-12 animate-fadeIn text-[1.01em]">
  //     <div className="bg-brand-earth p-10 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
  //       <div className="space-y-1">
  //         <div className="flex items-center gap-3">
  //           <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.5em]">
  //             Workshop Registry
  //           </span>
  //           <div className="h-px w-8 bg-brand-gold/20"></div>
  //         </div>
  //         <h2 className="text-3xl font-serif font-bold text-brand-gold tracking-tight">
  //           Tailor Unit Hub
  //         </h2>
  //         <p className="text-[10px] font-bold text-brand-gold/40 uppercase tracking-[0.4em]">
  //           Official Junction Enterprise Portal v2.0
  //         </p>
  //       </div>
  //       <div className="flex flex-col items-end gap-4">
  //         <div className="flex items-center gap-3 bg-brand-gold/10 px-4 py-2 rounded-xl border border-brand-gold/20 shadow-inner">
  //           <i className="fa-solid fa-user-ninja text-brand-gold"></i>
  //           <input
  //             type="text"
  //             value={currentTailor}
  //             onChange={(e) => setCurrentTailor(e.target.value)}
  //             className="bg-transparent text-brand-gold font-bold text-sm focus:outline-none border-b-2 border-brand-gold placeholder:text-brand-gold/30"
  //             placeholder="Tailor Name"
  //           />
  //         </div>
  //         <div className="flex items-center gap-8">
  //           <div className="text-center md:text-right">
  //             <p className="text-[8px] font-black text-brand-gold/30 uppercase tracking-widest mb-1">
  //               Active Jobs
  //             </p>
  //             <p className="text-xl font-mono font-bold text-brand-gold">
  //               {tailoringJobs.length}
  //             </p>
  //           </div>
  //           <div className="h-8 w-px bg-brand-gold/10"></div>
  //           <div className="text-center md:text-right">
  //             <p className="text-[8px] font-black text-brand-gold/30 uppercase tracking-widest mb-1">
  //               System Status
  //             </p>
  //             <span className="text-[10px] font-black text-brand-mint uppercase tracking-widest">
  //               Operational
  //             </span>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //     <div className="space-y-24">
  //       {tailoringJobs.map((job) => (
  //         <div
  //           key={job.id}
  //           className="grid grid-cols-1 lg:grid-cols-10 gap-16 items-start"
  //         >
  //           {/* 🔴 ADD THIS EXACTLY HERE */}
  //           {isDelayed(job) && (
  //             <div className="col-span-10 bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold mb-4">
  //               ⚠️ Delayed Job
  //             </div>
  //           )}

  //           {/* existing content continues below */}
  //           <div className="lg:col-span-4 space-y-16">
  //             <div className="space-y-8">
  //               <div className="flex items-center gap-4">
  //                 <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
  //                   <i className="fa-solid fa-user-tie text-brand-gold text-[10px]"></i>
  //                 </div>
  //                 <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.4em]">
  //                   Client Details
  //                 </h4>
  //               </div>
  //               <div className="flex items-center gap-8 bg-white p-8 rounded-[32px] border border-brand-earth/5 shadow-sm">
  //                 <div className="w-24 aspect-[3/4] rounded-2xl overflow-hidden border border-brand-earth/5 shadow-xl shrink-0">
  //                   <img
  //                     src={job.productImage}
  //                     className="w-full h-full object-cover"
  //                     alt="Fabric"
  //                   />
  //                 </div>
  //                 <div className="flex flex-col justify-center">
  //                   <h3 className="text-2xl font-serif font-bold text-brand-earth mb-2 tracking-tight">
  //                     {job.customerName}
  //                   </h3>
  //                   {/* 🔥 ADD THIS HERE */}
  //                   <span
  //                     className={`text-xs px-3 py-1 rounded-full font-bold ${
  //                       (jobPriority[job.id] || "medium") === "urgent"
  //                         ? "bg-red-500 text-white"
  //                         : (jobPriority[job.id] || "medium") === "low"
  //                           ? "bg-green-200 text-green-700"
  //                           : "bg-yellow-200 text-yellow-800"
  //                     }`}
  //                   >
  //                     {jobPriority[job.id] || "medium"}
  //                   </span>
  //                   <div className="space-y-2">
  //                     <p className="text-[10px] font-bold text-brand-earth/40 uppercase tracking-widest">
  //                       Fabric:{" "}
  //                       <span className="text-brand-earth">
  //                         {job.productName}
  //                       </span>
  //                     </p>
  //                     <p className="text-[10px] font-bold text-brand-earth/40 uppercase tracking-widest">
  //                       Order ID:{" "}
  //                       <span className="text-brand-earth">#{job.orderId}</span>
  //                     </p>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>

  //             <div className="space-y-8">
  //               <div className="flex items-center gap-4">
  //                 <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
  //                   <i className="fa-solid fa-ruler-combined text-brand-gold text-[10px]"></i>
  //                 </div>
  //                 <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.4em]">
  //                   Measurements
  //                 </h4>
  //               </div>
  //               <div className="grid grid-cols-2 gap-4">
  //                 {[
  //                   { label: "Chest", value: job.measurements.chest },
  //                   { label: "Waist", value: job.measurements.waist },
  //                   { label: "Shoulder", value: job.measurements.shoulder },
  //                   { label: "Length", value: job.measurements.length },
  //                 ].map((m, idx) => (
  //                   <div
  //                     key={idx}
  //                     className="bg-white aspect-square p-6 rounded-[32px] border border-brand-earth/5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all group/measure"
  //                   >
  //                     <span className="text-[9px] font-black text-brand-earth/30 uppercase tracking-[0.3em] mb-3">
  //                       {m.label}
  //                     </span>
  //                     <span className="text-3xl font-sans font-light text-brand-earth tracking-tight">
  //                       {m.value || "--"}
  //                       <span className="text-xs ml-1 opacity-20">"</span>
  //                     </span>
  //                   </div>
  //                 ))}
  //               </div>
  //             </div>
  //           </div>

  //           <div className="lg:col-span-6 flex flex-col h-full space-y-16">
  //             <div className="space-y-8">
  //               <div className="flex items-center gap-4">
  //                 <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
  //                   <i className="fa-solid fa-diagram-project text-brand-gold text-[10px]"></i>
  //                 </div>
  //                 <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.4em]">
  //                   Work Progress
  //                 </h4>
  //               </div>
  //               <div className="bg-brand-cream/20 p-10 rounded-[40px] border border-brand-earth/5 shadow-inner">
  //                 <TailoringProgressBar
  //                   currentStatus={job.currentStatus}
  //                   onStatusChange={(s) =>
  //                     updateJobStatus(job.id, s, `Updated to ${s}`)
  //                   }
  //                 />
  //                 {/* 🔥 ADD THIS EXACTLY HERE */}
  //                 <div className="flex gap-4 mt-4">
  //                   <select
  //                     value={jobPriority[job.id] || "medium"}
  //                     onChange={(e) =>
  //                       setJobPriority((prev) => ({
  //                         ...prev,
  //                         [job.id]: e.target.value,
  //                       }))
  //                     }
  //                     className="border px-3 py-2 rounded-lg text-sm"
  //                   >
  //                     <option value="low">Low</option>
  //                     <option value="medium">Medium</option>
  //                     <option value="urgent">Urgent</option>
  //                   </select>
  //                 </div>
  //               </div>
  //               <p className="text-xs text-brand-earth/40 mt-4">
  //                 Last updated by:{" "}
  //                 {job.statusHistory[job.statusHistory.length - 1]?.tailor ||
  //                   "System"}
  //               </p>
  //             </div>

  //             <div className="flex-1 flex flex-col space-y-16">
  //               <div className="space-y-8">
  //                 <div className="flex justify-between items-center">
  //                   <div className="flex items-center gap-4">
  //                     <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
  //                       <i className="fa-solid fa-camera text-brand-gold text-[10px]"></i>
  //                     </div>
  //                     <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.4em]">
  //                       Photos taken
  //                     </h4>
  //                   </div>
  //                   <label className="cursor-pointer text-brand-gold hover:text-brand-earth transition-colors">
  //                     <i className="fa-solid fa-circle-plus text-xl"></i>
  //                     <input
  //                       type="file"
  //                       className="hidden"
  //                       accept="image/*"
  //                       onChange={(e) => handleFileUpload(job.id, e)}
  //                     />
  //                   </label>
  //                 </div>
  //                 <div className="grid grid-cols-3 gap-4">
  //                   {[0, 1, 2].map((idx) => (
  //                     <div
  //                       key={idx}
  //                       className="aspect-square rounded-3xl overflow-hidden border border-brand-earth/5 shadow-lg relative group/proof bg-brand-silver/5"
  //                     >
  //                       {job.examples && job.examples[idx] ? (
  //                         <>
  //                           <img
  //                             src={job.examples[idx].url}
  //                             className="w-full h-full object-cover"
  //                             alt="Example"
  //                           />
  //                           <div
  //                             className="absolute inset-0 bg-brand-earth/80 opacity-0 group-hover/proof:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-[2px] cursor-pointer p-2 text-center"
  //                             onClick={() =>
  //                               setSelectedJobId(job.examples![idx].url)
  //                             }
  //                           >
  //                             <p className="text-[8px] text-brand-gold font-bold uppercase mb-1">
  //                               By: {job.examples[idx].capturedBy}
  //                             </p>
  //                             <p className="text-[7px] text-white/60 mb-2">
  //                               {job.examples[idx].capturedAt}
  //                             </p>
  //                             <i className="fa-solid fa-maximize text-white text-[10px]"></i>
  //                           </div>
  //                         </>
  //                       ) : (
  //                         <div className="w-full h-full flex items-center justify-center">
  //                           <i className="fa-solid fa-image text-brand-earth/5 text-3xl"></i>
  //                         </div>
  //                       )}
  //                     </div>
  //                   ))}
  //                 </div>
  //               </div>

  //               <div className="flex-1 space-y-8 flex flex-col">
  //                 <div className="flex items-center gap-4">
  //                   <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
  //                     <i className="fa-solid fa-check-double text-brand-gold text-[10px]"></i>
  //                   </div>
  //                   <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.4em]">
  //                     Final Result
  //                   </h4>
  //                 </div>
  //                 <div className="flex-1 relative min-h-[300px]">
  //                   <input
  //                     type="file"
  //                     id={`file-upload-${job.id}`}
  //                     className="hidden"
  //                     accept="image/*"
  //                     onChange={(e) => handleFinalUpload(job.id, e)}
  //                   />
  //                   <label
  //                     htmlFor={`file-upload-${job.id}`}
  //                     className={`flex items-center justify-center w-full h-full border-2 border-dashed rounded-[40px] transition-all duration-700 cursor-pointer bg-brand-silver/5 overflow-hidden group/final ${job.finishedProductImage ? "border-brand-gold bg-brand-gold/5" : "border-brand-earth/10 hover:border-brand-gold"}`}
  //                   >
  //                     {job.finishedProductImage ? (
  //                       <div className="relative w-full h-full">
  //                         <img
  //                           src={job.finishedProductImage.url}
  //                           className="w-full h-full object-cover"
  //                           alt="Preview"
  //                         />
  //                         <div className="absolute inset-0 bg-brand-earth/80 flex flex-col items-center justify-center opacity-0 group-hover/final:opacity-100 transition-opacity backdrop-blur-md p-4 text-center">
  //                           <p className="text-brand-gold font-bold uppercase text-xs mb-1">
  //                             Finished By: {job.finishedProductImage.capturedBy}
  //                           </p>
  //                           <p className="text-white/60 text-[10px] mb-4">
  //                             {job.finishedProductImage.capturedAt}
  //                           </p>
  //                           <i className="fa-solid fa-cloud-arrow-up text-brand-gold text-4xl mb-3"></i>
  //                           <p className="text-[11px] text-brand-gold font-black uppercase tracking-[0.5em]">
  //                             Update Final Result
  //                           </p>
  //                         </div>
  //                         <button
  //                           onClick={(e) => {
  //                             e.preventDefault();
  //                             e.stopPropagation();
  //                             removeFinalImage(job.id);
  //                           }}
  //                           className="absolute top-8 right-8 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition active:scale-90"
  //                         >
  //                           <i className="fa-solid fa-trash-can text-sm"></i>
  //                         </button>
  //                       </div>
  //                     ) : (
  //                       <div className="text-center group-hover/final:scale-110 transition-transform duration-700">
  //                         <div className="w-20 h-20 rounded-full bg-brand-silver/10 flex items-center justify-center mx-auto mb-6 border border-brand-silver/20">
  //                           <i className="fa-solid fa-cloud-arrow-up text-brand-earth/30 text-3xl"></i>
  //                         </div>
  //                         <p className="text-[11px] font-black text-brand-earth/40 uppercase tracking-[0.5em]">
  //                           Upload Final Result
  //                         </p>
  //                       </div>
  //                     )}
  //                   </label>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       ))}

  //       {selectedJobId && (
  //         <div
  //           className="fixed inset-0 z-[100] bg-brand-earth/95 backdrop-blur-md flex items-center justify-center p-6 md:p-12 animate-fadeIn"
  //           onClick={() => setSelectedJobId(null)}
  //         >
  //           <button
  //             onClick={() => setSelectedJobId(null)}
  //             className="absolute top-8 right-8 text-white text-3xl hover:text-brand-gold transition-colors"
  //           >
  //             <i className="fa-solid fa-xmark"></i>
  //           </button>

  //           <div
  //             className="max-w-4xl w-full max-h-[85vh] rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
  //             onClick={(e) => e.stopPropagation()}
  //           >
  //             <img
  //               src={selectedJobId}
  //               className="w-full h-full object-contain"
  //               alt="Zoomed Fabric"
  //             />
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );

  const renderTailoring = () => {
    const filteredJobs =
      filterStatus === "All"
        ? tailoringJobs
        : tailoringJobs.filter((job) =>
            job.currentStatus
              .toLowerCase()
              .includes(filterStatus.toLowerCase()),
          );

    return (
      <div className="space-y-12 animate-fadeIn text-[1.01em]">
        {/* ================= CLEAN OVERVIEW ================= */}
        <div className="bg-white p-6 rounded-2xl shadow border flex justify-between items-center">
          <h2 className="text-xl font-bold">Tailoring Overview</h2>

          <div className="flex gap-6 text-sm">
            <span>All: {tailoringJobs.length}</span>
            <span>
              Pending:{" "}
              {
                tailoringJobs.filter((j) => j.currentStatus.includes("Fabric"))
                  .length
              }
            </span>
            <span>
              Stitching:{" "}
              {
                tailoringJobs.filter((j) => j.currentStatus.includes("Stitch"))
                  .length
              }
            </span>
            <span>
              Done:{" "}
              {
                tailoringJobs.filter((j) =>
                  j.currentStatus.includes("Dispatched"),
                ).length
              }
            </span>
          </div>
        </div>

        {/* ================= FILTER ================= */}
        <div className="flex gap-3">
          {["All", "Fabric", "Stitch", "Dispatch"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 rounded-full text-sm ${
                filterStatus === f ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ================= QUICK CARDS ================= */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`p-6 rounded-2xl border shadow-lg transition hover:shadow-2xl ${
                job.currentStatus.includes("Fabric")
                  ? "bg-red-50 border-red-300"
                  : "bg-white"
              }`}
            >
              <h3 className="font-bold text-lg">{job.productName}</h3>

              <p className="text-sm text-gray-500">Order #{job.orderId}</p>

              <div className="grid grid-cols-2 text-sm mt-3">
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* BEFORE IMAGE */}
                  <div>
                    <p className="text-xs font-bold mb-1">Before</p>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(job.id, e)}
                      className="text-xs mb-2"
                    />

                    {job.examples && job.examples.length > 0 && (
                      <img
                        src={job.examples[0].url}
                        className="w-full h-28 object-cover rounded-lg border"
                      />
                    )}
                  </div>

                  {/* AFTER IMAGE */}
                  <div>
                    <p className="text-xs font-bold mb-1">After</p>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFinalUpload(job.id, e)}
                      className="text-xs mb-2"
                    />

                    {job.finishedProductImage && (
                      <img
                        src={job.finishedProductImage.url}
                        className="w-full h-28 object-cover rounded-lg border"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(job.id, e)}
                    className="text-xs"
                  />

                  {/* 🔥 SHOW IMAGE */}
                  {job.examples && job.examples.length > 0 && (
                    <img
                      src={job.examples[job.examples.length - 1].url}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  )}
                </div>
                <p>Chest: {job.measurements?.chest}</p>
                <p>Waist: {job.measurements?.waist}</p>
                <p>Shoulder: {job.measurements?.shoulder}</p>
                <p>Length: {job.measurements?.length}</p>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handleDeleteJob(job.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white transition"
                >
                  Delete
                </button>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    "Fabric Received",
                    "Stitching",
                    "Quality Check",
                    "Dispatched",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateJobStatus(job.id, status, "")}
                      className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-black hover:text-white transition"
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <span className="text-xs bg-gray-200 px-3 py-1 rounded-full">
                  {job.currentStatus}
                </span>

                <button
                  onClick={() => setSelectedJobId(job.id)}
                  className="text-sm text-blue-600"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ================= YOUR ORIGINAL UI ================= */}
        <div className="bg-brand-earth p-10 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
          {/* KEEP YOUR ORIGINAL HEADER */}
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-bold text-brand-gold">
              Tailor Unit Hub
            </h2>
          </div>
        </div>

        <div className="space-y-24">
          {tailoringJobs.map((job) => (
            <div
              key={job.id}
              id={`job-${job.id}`} // 🔥 scroll target added
              className="grid grid-cols-1 lg:grid-cols-10 gap-16 items-start"
            >
              {/* KEEP ALL YOUR EXISTING CONTENT BELOW */}
              {/* ⚠️ DO NOT TOUCH REST OF YOUR ORIGINAL CODE */}
            </div>
          ))}
        </div>

        {/* ================= MODAL ================= */}
        {selectedJobId && (
          <div className="fixed top-0 left-0 w-full h-full z-[100] flex items-start justify-center pt-24">
            {/* 🔥 LIGHT BACKDROP */}
            <div
              className="absolute inset-0 bg-black/10"
              onClick={() => setSelectedJobId(null)}
            ></div>

            {/* 🔥 SMALL POPUP CARD */}
            <div
              className="relative bg-white w-[350px] rounded-xl shadow-xl p-5 border animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const job = tailoringJobs.find((j) => j.id === selectedJobId);
                if (!job) return null;

                return (
                  <>
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-base font-bold">{job.productName}</h2>
                      <button
                        onClick={() => setSelectedJobId(null)}
                        className="text-gray-400 hover:text-black"
                      >
                        ✕
                      </button>
                    </div>

                    {/* INFO */}
                    <p className="text-xs text-gray-500">
                      Order: #{job.orderId}
                    </p>
                    <p className="text-xs mb-2">
                      Customer:{" "}
                      <span className="font-semibold">{job.customerName}</span>
                    </p>

                    {/* MEASUREMENTS */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <p>Chest: {job.measurements?.chest || "-"}</p>
                      <p>Waist: {job.measurements?.waist || "-"}</p>
                      <p>Shoulder: {job.measurements?.shoulder || "-"}</p>
                      <p>Length: {job.measurements?.length || "-"}</p>
                    </div>

                    {/* STATUS */}
                    <span className="text-[10px] bg-gray-200 px-2 py-1 rounded-full">
                      {job.currentStatus}
                    </span>

                    {/* IMAGES */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {job.examples?.[0] && (
                        <img
                          src={job.examples[0].url}
                          className="h-20 w-full object-cover rounded"
                        />
                      )}

                      {job.finishedProductImage && (
                        <img
                          src={job.finishedProductImage.url}
                          className="h-20 w-full object-cover rounded"
                        />
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrders = () => (
    <div className="space-y-10 animate-fadeIn text-center">
      <h2 className="text-3xl font-serif font-bold text-brand-earth">
        Recent Orders
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="relative bg-brand-white p-8 rounded-[40px] border-2 border-brand-silver shadow-lg flex flex-col md:flex-row items-center justify-between gap-6"
          >
            {/* ❌ DELETE BUTTON */}
            <button
              onClick={() => handleDeleteOrder(order.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-lg"
            >
              ✕
            </button>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand-mint/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-box-open text-brand-earth text-2xl"></i>
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-brand-earth">
                  {order.customer?.name || "Customer"}
                </p>
                <p className="text-sm font-mono text-brand-earth/40">
                  Order #{order.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-[10px] font-black text-brand-earth/30 uppercase">
                  Status
                </p>
                <span
                  className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${order.status === "Delivered" ? "bg-brand-mint text-brand-earth" : "bg-brand-gold/20 text-brand-gold"}`}
                >
                  {order.status || "Placed"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-brand-earth/30 uppercase">
                  Total Bill
                </p>
                <p className="text-2xl font-bold text-brand-earth">
                  ₹
                  {order.items
                    ?.reduce(
                      (acc: number, item: any) =>
                        acc + item.pricePerMeter * item.quantity,
                      0,
                    )
                    .toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(order)}
                className="mt-4 px-4 py-2 bg-brand-earth text-white rounded-xl text-xs"
              >
                View Details
              </button>
              {selectedOrder && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
                  {/* BACKDROP */}
                  <div
                    className="fixed inset-0 backdrop-blur-[2px] bg-black/10"
                    onClick={() => setSelectedOrder(null)}
                  ></div>

                  {/* MODAL */}
                  <div
                    className="relative bg-white w-[380px] p-5 rounded-xl shadow-2xl border animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-base font-bold">
                        Order #{selectedOrder.id}
                      </h2>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-gray-400 hover:text-black"
                      >
                        ✕
                      </button>
                    </div>

                    {/* ================= CUSTOMER ================= */}
                    <div className="text-xs space-y-1 mb-4">
                      <p>
                        <b>Name:</b> {selectedOrder.customer?.name || "-"}
                      </p>
                      <p>
                        <b>Phone:</b> {selectedOrder.customer?.phone || "-"}
                      </p>
                      <p>
                        <b>Email:</b> {selectedOrder.customer?.email || "-"}
                      </p>

                      {/* ✅ Address (single source of truth) */}
                      <p>
                        <b>Address:</b> {selectedOrder.customer?.address || "-"}
                      </p>
                    </div>

                    {/* ================= ITEMS ================= */}
                    <div className="text-xs">
                      <p className="font-semibold mb-2">Items</p>

                      {selectedOrder.items?.map((item: any, i: number) => {
                        const product = getProduct(item.productId); // ✅ FIXED KEY

                        return (
                          <div key={i} className="border p-2 rounded mb-2">
                            <p className="font-bold">
                              {product?.name || "Unknown Product"}
                            </p>

                            <p>Qty: {item.quantity}</p>
                            <p>Price: ₹{item.pricePerMeter}</p>

                            {item.addTailoringService && (
                              <div className="mt-1 text-gray-600">
                                <p>
                                  <b>Measurements:</b>
                                </p>
                                <p>Chest: {item.measurements?.chest || "-"}</p>
                                <p>Waist: {item.measurements?.waist || "-"}</p>
                                <p>
                                  Shoulder: {item.measurements?.shoulder || "-"}
                                </p>
                                <p>
                                  Length: {item.measurements?.length || "-"}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* EMPTY STATE */}
                      {(!selectedOrder.items ||
                        selectedOrder.items.length === 0) && (
                        <p className="text-gray-400">No items found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-10 animate-fadeIn text-center">
      <h2 className="text-3xl font-serif font-bold text-brand-earth">
        Our Customers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SAMPLE_CUSTOMERS.map((customer) => (
          <div
            key={customer.id}
            className="bg-brand-white p-10 rounded-[40px] border-2 border-brand-silver shadow-lg flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold text-4xl font-serif font-bold border-4 border-brand-gold/20 mb-6">
              {customer.name.charAt(0)}
            </div>
            <h4 className="text-2xl font-serif font-bold text-brand-earth mb-2">
              {customer.name}
            </h4>
            <p className="text-sm text-brand-earth/50 font-bold mb-6">
              {customer.email}
            </p>
            <div className="flex gap-8 w-full border-t border-brand-silver pt-6">
              <div className="flex-1 text-center">
                <p className="text-[10px] font-black text-brand-earth/30 uppercase">
                  Bought
                </p>
                <p className="text-xl font-bold text-brand-earth">
                  {Math.floor(Math.random() * 5) + 1} Times
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-[10px] font-black text-brand-earth/30 uppercase">
                  Status
                </p>
                <p className="text-sm font-bold text-brand-mint uppercase tracking-widest">
                  Active User
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const filteredJobs =
    filterStatus === "All"
      ? tailoringJobs
      : tailoringJobs.filter((job) => job.currentStatus.includes(filterStatus));

  return (
    <div className="min-h-screen relative z-0 overflow-x-hidden ...">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 md:mb-20 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-brand-silver/30 pb-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.5em]">
                  System Registry
                </span>
                <div className="h-px w-12 bg-brand-gold/30"></div>
              </div>
              <h1 className="text-4xl md:text-7xl font-serif font-bold text-brand-earth tracking-tighter leading-none">
                ADMIN{" "}
                <span className="italic font-normal text-brand-earth/50">
                  CONSOLE
                </span>
              </h1>
              <p className="text-[11px] font-bold text-brand-earth/40 uppercase tracking-[0.4em]">
                Official Junction Enterprise Portal v2.0
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center md:text-right">
                <p className="text-[9px] font-black text-brand-earth/30 uppercase tracking-widest mb-1">
                  Active Sessions
                </p>
                <p className="text-2xl font-mono font-bold text-brand-earth">
                  04
                </p>
              </div>
              <div className="h-12 w-px bg-brand-silver/30"></div>
              <div className="text-center md:text-right">
                <p className="text-[9px] font-black text-brand-earth/30 uppercase tracking-widest mb-1">
                  Registry Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-mint animate-pulse"></div>
                  <span className="text-xs font-bold text-brand-earth uppercase tracking-widest">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          <nav className="flex flex-wrap items-center gap-4 md:gap-6 animate-fadeIn border-b border-brand-silver/20 pb-8">
            {[
              {
                id: "tailor-unit",
                label: "Tailor Unit",
                icon: "fa-scissors",
              },
              { id: "analytics", label: "Analytics", icon: "fa-chart-line" },
              { id: "inventory", label: "Inventory", icon: "fa-warehouse" },
              { id: "orders", label: "Orders", icon: "fa-box" },
              // { id: "customers", label: "Customers", icon: "fa-users" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-500 font-black uppercase tracking-[0.3em] text-[10px] border ${activeTab === tab.id ? "bg-brand-earth text-brand-gold border-brand-earth shadow-2xl -translate-y-1" : "bg-white/60 text-brand-earth/40 border-brand-silver/20 hover:bg-brand-gold/10 hover:text-brand-earth hover:border-brand-gold/20"}`}
              >
                <i className={`fa-solid ${tab.icon} text-xs`}></i>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="w-full bg-brand-white rounded-[48px] md:rounded-[64px] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-brand-silver/30 overflow-hidden min-h-[600px] md:min-h-[800px] relative animate-fadeIn">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-bl-[100px] pointer-events-none"></div>
            <div className="p-8 md:p-12 lg:p-20 relative z-10">
              {activeTab === "analytics" && renderAnalytics()}
              {activeTab === "inventory" && renderInventory()}
              {activeTab === "tailor-unit" && renderTailoring()}
              {activeTab === "orders" && renderOrders()}
              {activeTab === "customers" && renderCustomers()}
            </div>
          </div>
        </div>
      </div>
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Product</h2>

            <input
              placeholder="Name"
              className="border p-2 w-full mb-3"
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />

            <input
              placeholder="SKU"
              className="border p-2 w-full mb-3"
              onChange={(e) =>
                setNewProduct({ ...newProduct, sku: e.target.value })
              }
            />

            <input
              placeholder="Price"
              type="number"
              className="border p-2 w-full mb-3"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  pricePerMeter: Number(e.target.value),
                })
              }
            />
            <select
              value={selectedProduct?.category || ""}
              onChange={(e) =>
                setSelectedProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        category: e.target.value,
                      }
                    : prev,
                )
              }
              className="border p-2 w-full mb-3"
            >
              <option>Cotton</option>
              <option>Linen</option>
              <option>Silk</option>
              <option>Denim</option>
              <option>Polyester</option>
            </select>

            <textarea
              placeholder="Short Description"
              className="border p-2 w-full mb-3 rounded-lg"
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />

            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setNewProduct({
                  ...newProduct,
                  imageFiles: files,
                });
              }}
              className="border p-2 w-full mb-3"
            />

            <button
              onClick={handleAddProduct}
              className="bg-black text-white px-4 py-2 w-full"
            >
              Save Product
            </button>

            <button
              onClick={() => setShowAddForm(false)}
              className="mt-2 text-red-500 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
