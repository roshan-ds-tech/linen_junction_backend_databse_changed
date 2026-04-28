const API_URL = import.meta.env.VITE_API_URL;
import React, { useState } from "react";
import { CartItem, User } from "../types";
let hasPlacedOrder = false;
declare global {}

interface CheckoutProps {
  cart: CartItem[];
  onComplete: (orderDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
  }) => void;
  user: User | null;
}

const Checkout: React.FC<CheckoutProps> = ({ cart, onComplete, user }) => {
  const [step, setStep] = useState<"logistics">("logistics");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    zip: "",
    phone: "",
  });

  // const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce(
    (acc, item) =>
      acc +
      (item.discountPrice || item.pricePerMeter) *
        item.selectedMeters *
        item.quantity,
    0,
  );
  const tailoringTotal = cart.reduce(
    (acc, item) => acc + (item.stitchingPrice || 0) * item.quantity,
    0,
  );
  const total = subtotal + tailoringTotal;

  const handlePlaceOrder = async () => {
    if (hasPlacedOrder) return; // 🚨 GLOBAL BLOCK
    hasPlacedOrder = true;
    try {
      if (!formData.name || !formData.phone || !formData.address) {
        alert("Please fill all details");
        return;
      }

      const orderData = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: `${formData.address}, ${formData.city} - ${formData.zip}`,
        },

        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.discountPrice || item.pricePerMeter,

          addTailoringService: item.addTailoringService || false,

          stitchingType: item.stitchingType || null, // ✅ NEW
          stitchingPrice: item.stitchingPrice || 0, // ✅ NEW

          measurements: item.measurements || {},
          selectedMeters: item.selectedMeters || 1,
        })),

        tailoring: cart.find((i) => i.addTailoringService)
          ? {
              measurements: cart.find((i) => i.addTailoringService)
                ?.measurements,
              style: "custom",
              notes: "",
            }
          : null,
      };

      // ✅ SAVE ORDER
      // await fetch(`${API_URL}/api/orders`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(orderData),
      // });

      // ✅ CREATE WHATSAPP MESSAGE
      const message = `
 *LINEN JUNCTION ORDER*

Hi, I’ve placed an order. Please share payment link / QR.

Name: ${formData.name}
Phone: ${formData.phone}
Address: ${formData.address}, ${formData.city} - ${formData.zip}

 ITEMS:
${cart
  .map(
    (item, i) => `
${i + 1}. ${item.name}
Qty: ${item.quantity}
Meters: ${item.selectedMeters}
Tailoring: ${
      item.stitchingType
        ? `${item.stitchingType} (₹${item.stitchingPrice})`
        : "No"
    }Measurements: ${
      item.measurements
        ? Object.entries(item.measurements)
            .map(([key, val]) => `${key}: ${val}`)
            .join(", ")
        : "N/A"
    }
`,
  )
  .join("\n")}

 Total: ₹${total}
`;

      // 🔴 PUT YOUR NUMBER HERE
      const ownerPhone = "8660014255";

      const whatsappURL = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(
        message,
      )}`;

      // Open WhatsApp in new tab
      window.open(whatsappURL, "_blank");

      // Clear cart immediately
      localStorage.setItem("linen_junction_cart", JSON.stringify([]));

      // Optional: trigger UI refresh if you have state
      onComplete(formData);

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      console.error("Order failed ❌", err);
    }
  };

  return (
    <div className="bg-brand-white min-h-screen py-12 md:py-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-16 space-y-4">
          <h4 className="text-[10px] md:text-xs font-bold text-brand-gold uppercase tracking-[0.4em]">
            Secure Terminal
          </h4>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-brand-earth tracking-tight">
            {step === "logistics"
              ? "Final Settlement"
              : step === "payment-method"
                ? "Choose Payment"
                : "Payment Details"}
          </h1>
          <div className="w-16 h-1 bg-brand-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-12">
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-brand-silver/30 relative overflow-hidden min-h-[600px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-bl-[100px] pointer-events-none"></div>

              {step === "logistics" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-brand-earth mb-10 flex items-center gap-4">
                    <i className="fa-solid fa-truck-fast text-brand-gold"></i>
                    Logistics Registry
                  </h3>

                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                          Full Name
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                          Email Address
                        </label>
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                        Shipping Address
                      </label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20 h-32 resize-none"
                        placeholder="Street, Building, Apartment..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                          City
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                          Zip Code
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.zip}
                          onChange={(e) =>
                            setFormData({ ...formData, zip: e.target.value })
                          }
                          className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20 font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                          Phone Number
                        </label>
                        <input
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20"
                        />
                      </div>
                    </div>

                    <div className="pt-10">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        className="w-full bg-brand-earth text-brand-gold font-bold tracking-[0.3em] py-6 rounded-2xl shadow-2xl hover:-translate-y-1 transition-all uppercase text-sm md:text-base group"
                      >
                        PLACE ORDER — ₹{total.toLocaleString()}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-brand-earth p-10 md:p-12 rounded-[40px] text-brand-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-48 h-48 bg-brand-gold/5 rounded-br-[100px] pointer-events-none"></div>
              <h3 className="text-xl font-serif font-bold text-brand-gold mb-10 flex items-center gap-4">
                <i className="fa-solid fa-receipt"></i>
                Manifest Summary
              </h3>

              <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto custom-scroll pr-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-6 group">
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-brand-gold/20 shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-500">
                      <img
                        src={
                          item.image
                            ? `${API_URL}${item.image}`
                            : "https://via.placeholder.com/150"
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-serif font-bold text-brand-white text-base leading-tight mb-1">
                        {item.name}
                      </h5>
                      <p className="text-[9px] text-brand-gold font-black uppercase tracking-widest">
                        {item.selectedMeters}m • {item.selectedColor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-gold">
                        ₹
                        {(
                          (item.discountPrice || item.pricePerMeter) *
                            item.selectedMeters +
                          (item.stitchingPrice || 0)
                        ).toLocaleString()}
                      </p>

                      {item.stitchingType && (
                        <p className="text-[10px] text-brand-mint">
                          ✂ {item.stitchingType} (+₹{item.stitchingPrice})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-10 border-t border-brand-gold/20">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">
                  <span>Textile Value</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">
                  <span>Artisan Services</span>
                  <span>₹{tailoringTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">
                  <span>Logistics</span>
                  <span className="text-brand-mint">Complimentary</span>
                </div>
                <div className="flex justify-between items-end pt-6">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-gold">
                    Total Registry Value
                  </span>
                  <span className="text-3xl font-bold text-brand-gold tracking-tighter">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-brand-mint/10 p-8 rounded-[32px] border border-brand-mint/30 flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-earth shrink-0">
                <i className="fa-solid fa-shield-halved text-xl"></i>
              </div>
              <div>
                <h5 className="text-[10px] font-black text-brand-earth uppercase tracking-widest mb-1">
                  Encrypted Transaction
                </h5>
                <p className="text-[10px] text-brand-earth/60 leading-relaxed">
                  Your settlement is secured with 256-bit artisan encryption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
