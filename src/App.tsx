import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import CareAssistant from "./components/CareAssistant";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import AdminDashboard from "./pages/AdminDashboard";
import OrderHistory from "./pages/OrderHistory";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import OurStory from "./pages/OurStory";
import Archive from "./pages/Archive";
import Newsletter from "./pages/Newsletter";
import SizeGuide from "./pages/SizeGuide";
import FabricCare from "./pages/FabricCare";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import ReturnRequest from "./pages/ReturnRequest";
import CustomerSupport from "./pages/CustomerSupport";
import CareArchive from "./pages/CareArchive";
import TrackOrder from "./pages/TrackOrder";
import OrderTrackingDetail from "./pages/OrderTrackingDetail";
import { Product, CartItem, User, TailoringJob } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "https://linen-junction-new-final.onrender.com";

const App: React.FC = () => {
  const [page, setPage] = useState<string>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scrollToId, setScrollToId] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("linen_junction_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingInfo, setTrackingInfo] = useState<{
    orderId: string;
    name: string;
  } | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("linen_junction_session");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("linen_junction_session") !== null;
  });

  // tailoringJobs is now just passed through to AdminDashboard & OrderHistory.
  // AdminDashboard owns the real fetch logic — App no longer duplicates it.
  const [tailoringJobs, setTailoringJobs] = useState<TailoringJob[]>([]);

  useEffect(() => {
    localStorage.setItem("linen_junction_cart", JSON.stringify(cart));
  }, [cart]);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("linen_junction_session", JSON.stringify(userData));

    if (userData.role === "admin") {
      setPage("admin");
    } else if (page === "auth") {
      setPage("checkout");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("linen_junction_session");
    setPage("home");
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setScrollToId(product.id);
    setPage("product");
    window.scrollTo(0, 0);
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.findIndex(
        (i) =>
          i.id === item.id &&
          i.selectedMeters === item.selectedMeters &&
          i.selectedColor === item.selectedColor,
      );
      if (existing >= 0) {
        const newCart = [...prev];
        newCart[existing].quantity += item.quantity;
        return newCart;
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const quickAdd = (product: Product, meters: string) => {
    const item: CartItem = {
      ...product,
      selectedMeters: parseFloat(
        meters || product.availableLengths?.[0] || "1",
      ),
      selectedColor: product.colors?.[0] || "",
      addTailoringService: false,
      quantity: 1,
    };
    addToCart(item);
  };

  const removeFromCart = (id: string, meters: number, color: string) => {
    setCart((prev) =>
      prev.filter(
        (i) =>
          !(
            i.id === id &&
            i.selectedMeters === meters &&
            i.selectedColor === color
          ),
      ),
    );
  };

  const updateCartQuantity = (
    id: string,
    meters: number,
    color: string,
    delta: number,
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.id === id &&
          item.selectedMeters === meters &&
          item.selectedColor === color
        ) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    );
  };

  // FIX: completeOrder now actually posts to the DB.
  // Previously it only called createJob() (a separate unknown API) and never
  // hit POST /api/orders, so nothing was saved to SQLite.
  const completeOrder = async (orderDetails: {
    email: string;
    phone: string;
    name: string;
    address?: string;
    measurements?: Record<string, string>;
  }) => {
    try {
      // Build items payload — map CartItem to what the server expects.
      // Key fix: server now accepts `id` as the product identifier (matches CartItem),
      // and reads addTailoringService + measurements from each item.
      const itemsPayload = cart.map((item) => ({
        id: item.id, // server reads this as product_id
        product_id: item.id, // explicit fallback
        quantity: item.quantity,
        price: item.pricePerMeter * item.selectedMeters,
        selectedMeters: item.selectedMeters,
        addTailoringService: item.addTailoringService || false,
        measurements: item.measurements || {},
      }));

      const hasTailoring = cart.some((i) => i.addTailoringService);

      const body = {
        customer: {
          name: orderDetails.name,
          phone: orderDetails.phone,
          email: orderDetails.email,
          address: orderDetails.address || "",
        },
        items: itemsPayload,
        // Top-level tailoring block (for backward compat with old admin code).
        // Per-item tailoring is now also stored via order_items.add_tailoring.
        tailoring: hasTailoring
          ? {
              measurements: orderDetails.measurements || {},
              style: "",
              notes: "",
            }
          : null,
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order failed");
      }

      const { orderId } = await res.json();
      console.log("✅ Order saved to DB:", orderId);

      setCart([]);
      setPage("orders");
      window.scrollTo(0, 0);
      alert(
        `Order Confirmed! Confirmation sent to ${orderDetails.email} and ${orderDetails.phone}.`,
      );
    } catch (err: any) {
      console.error("Order error:", err);
      alert("❌ Order failed: " + err.message);
    }
  };

  const navigateToShop = () => {
    setCategoryFilter(undefined); // ❌ REMOVE FILTER
    setSearchQuery("");
    setScrollToId(undefined);
    setPage("shop");
    window.scrollTo(0, 0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setScrollToId(undefined);
    setPage("shop");
    window.scrollTo(0, 0);
  };

  const handleTrackingConfirm = (orderId: string, name: string) => {
    setTrackingInfo({ orderId, name });
    setPage("tracking-detail");
    window.scrollTo(0, 0);
  };

  const navigateToPage = (target: string) => {
    setPage(target);
    window.scrollTo(0, 0);
  };

  const handleOrders = () => {
    setPage(isAuthenticated ? "orders" : "auth");
    window.scrollTo(0, 0);
  };

  const handleNewArrivals = () => {
    if (page !== "home") {
      setPage("home");
      setTimeout(() => {
        document
          .getElementById("new-arrivals")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document
        .getElementById("new-arrivals")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHomeClick = () => {
    setPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-brand-gold selection:text-brand-earth bg-brand-cream">
      <Navbar
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAdminClick={() => {
          if (user?.role === "admin") {
            setPage("admin");
          } else {
            setPage("auth");
          }
        }}
        onHomeClick={() => {
          setPage("home");
          window.scrollTo(0, 0);
        }}
        onOrdersClick={handleOrders}
        onShopClick={navigateToShop}
        onSearchSubmit={handleSearch}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={page}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex-grow"
        >
          {page === "home" && (
            <Home
              onProductClick={navigateToProduct}
              onQuickAdd={quickAdd}
              onShopAll={() => navigateToShop()}
              onCategoryClick={navigateToShop}
              onOurStoryClick={() => setPage("our-story")}
            />
          )}
          {page === "shop" && (
            <Shop
              onProductClick={navigateToProduct}
              onQuickAdd={quickAdd}
              initialCategory={categoryFilter}
              externalSearchQuery={searchQuery}
              scrollToProductId={scrollToId}
            />
          )}
          {page === "product" && selectedProduct && (
            <ProductDetails
              product={selectedProduct}
              onAddToCart={addToCart}
              onBack={() => setPage("shop")}
            />
          )}
          {page === "admin" &&
            (user?.role === "admin" ? (
              <AdminDashboard
                tailoringJobs={tailoringJobs}
                setTailoringJobs={setTailoringJobs}
              />
            ) : (
              <Auth onLogin={handleLoginSuccess} />
            ))}
          {page === "orders" && (
            <OrderHistory
              isAuthenticated={isAuthenticated}
              onLoginNavigate={() => setPage("auth")}
              tailoringJobs={tailoringJobs}
            />
          )}
          {page === "checkout" && (
            <Checkout cart={cart} onComplete={completeOrder} user={user} />
          )}
          {page === "support" && (
            <CustomerSupport
              onNavigate={navigateToPage}
              onOpenChat={() => setIsAssistantOpen(true)}
            />
          )}
          {page === "customer-support" && (
            <CustomerSupport
              onNavigate={navigateToPage}
              onOpenChat={() => setIsAssistantOpen(true)}
            />
          )}
          {page === "size-guide" && <SizeGuide />}
          {page === "fabric-care" && (
            <FabricCare
              onOpenChat={() => setIsAssistantOpen(true)}
              onExploreArchive={() => setPage("care-archive")}
            />
          )}
          {page === "care-archive" && <CareArchive />}
          {page === "shipping" && (
            <ShippingPolicy onTrackOrder={() => setPage("track-order")} />
          )}
          {page === "track-order" && (
            <TrackOrder onConfirm={handleTrackingConfirm} />
          )}
          {page === "tracking-detail" && trackingInfo && (
            <OrderTrackingDetail
              orderId={trackingInfo.orderId}
              name={trackingInfo.name}
            />
          )}
          {page === "returns" && (
            <ReturnsPolicy onInitiateReturn={() => setPage("return-request")} />
          )}
          {page === "return-request" && <ReturnRequest />}
          {page === "our-story" && (
            <OurStory
              onExploreArchive={() => setPage("archive")}
              onBeginJourney={() => setPage("auth")}
            />
          )}
          {page === "archive" && <Archive />}
          {page === "newsletter" && (
            <Newsletter onReturnHome={() => navigateToPage("home")} />
          )}
          {page === "auth" && <Auth onLogin={handleLoginSuccess} />}
        </motion.main>
      </AnimatePresence>

      <Footer
        onHomeClick={handleHomeClick}
        onNewArrivalsClick={handleNewArrivals}
        onCategoryClick={navigateToShop}
        onSupportClick={() => navigateToPage("customer-support")}
        onSizeGuideClick={() => navigateToPage("size-guide")}
        onFabricCareClick={() => navigateToPage("fabric-care")}
        onShippingPolicyClick={() => navigateToPage("shipping")}
        onReturnsClick={() => navigateToPage("returns")}
        onNewsletterClick={() => navigateToPage("newsletter")}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setPage("checkout");
        }}
      />

      <button
        onClick={() => {
          const phone = "8660014255";
          const message = encodeURIComponent(
            "Hi, I'm interested in your linen fabrics.",
          );
          window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        }}
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="20"
          height="20"
          fill="white"
        >
          <path d="M16.04 2.003c-7.732 0-14 6.268-14 14 0 2.469.646 4.883 1.875 7.01L2 30l7.197-1.884A13.94 13.94 0 0 0 16.04 30c7.732 0 14-6.268 14-14s-6.268-14-14-14zm0 25.5a11.47 11.47 0 0 1-5.838-1.6l-.417-.247-4.27 1.117 1.14-4.157-.27-.43a11.48 11.48 0 1 1 9.655 5.317zm6.317-8.617c-.345-.172-2.04-1.007-2.357-1.122-.316-.115-.547-.172-.777.173s-.892 1.122-1.094 1.354c-.202.23-.403.259-.748.086-.345-.173-1.458-.537-2.778-1.712-1.026-.915-1.72-2.045-1.922-2.39-.201-.345-.021-.53.151-.702.156-.155.345-.403.518-.604.173-.202.23-.345.345-.575.115-.23.057-.431-.029-.604-.086-.172-.777-1.875-1.065-2.567-.28-.672-.566-.58-.777-.59l-.663-.011c-.23 0-.604.086-.92.431-.316.345-1.208 1.18-1.208 2.877 0 1.697 1.237 3.335 1.41 3.565.172.23 2.433 3.717 5.897 5.215.824.356 1.466.568 1.967.727.826.263 1.578.226 2.173.137.663-.099 2.04-.834 2.328-1.64.287-.805.287-1.495.201-1.64-.086-.144-.316-.23-.662-.403z" />
        </svg>
        WhatsApp
      </button>
    </div>
  );
};

export default App;
