import { API_URL } from "../config";
import React from "react";
import { CartItem } from "../types";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string, meters: number, color: string) => void;
  onUpdateQuantity: (
    id: string,
    meters: number,
    color: string,
    delta: number,
  ) => void;
  onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
  onUpdateQuantity,
  onCheckout,
}) => {
  const subtotal = items.reduce(
    (acc, item) =>
      acc +
      ((item.discountPrice || item.pricePerMeter) * item.selectedMeters +
        (item.stitchingPrice || 0)) *
        item.quantity,
    0,
  );
  console.log("CART ITEMS:", items);

  // const handleCheckout = async () => {
  //   try {
  //     console.log("Sending items:", items); // 🔥 debug

  //     await fetch(`${API_URL}/api/orders`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         items: items, // 🔥 THIS IS CRITICAL
  //       }),
  //     });

  //     console.log("Order saved ✅");

  //     onCheckout(); // clear cart AFTER saving
  //   } catch (err) {
  //     console.error("Checkout failed ❌", err);
  //   }
  // };

  const handleCheckout = () => {
    onCheckout(); // Clear cart first
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-brand-earth/60 backdrop-blur-sm transition-opacity z-[60] ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      ></div>

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-brand-white z-[70] shadow-2xl transition-transform duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
      >
        <div className="p-6 md:p-8 border-b border-brand-earth/10 flex justify-between items-center shrink-0 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-brand-earth tracking-tight">
              YOUR CART
            </h2>
            <p className="text-[8px] md:text-[9px] font-bold text-brand-earth/40 uppercase tracking-[0.3em] mt-1 italic">
              Registry Selection
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-brand-earth hover:bg-brand-earth hover:text-brand-white transition-all duration-300 absolute right-6 md:right-8"
          >
            <i className="fa-solid fa-xmark text-lg md:text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-6 md:p-8">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8 animate-fadeIn">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-gold/20 rounded-full flex items-center justify-center mb-6 md:mb-8 border border-brand-gold/30">
                <i className="fa-solid fa-bag-shopping text-3xl md:text-4xl text-brand-earth/20"></i>
              </div>
              <p className="text-brand-earth font-serif text-lg md:text-xl mb-2">
                The bag is empty
              </p>
              <p className="text-brand-earth/50 text-[10px] md:text-xs font-light max-w-[180px] md:max-w-[200px] mx-auto leading-relaxed">
                Your artisan selection hasn't been woven into the registry yet.
              </p>
              <button
                onClick={onClose}
                className="mt-8 md:mt-10 bg-brand-earth text-brand-gold px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-[9px] md:text-[10px] tracking-[0.3em] uppercase hover:scale-105 transition-transform shadow-lg"
              >
                START BROWSING
              </button>
            </div>
          ) : (
            <div className="space-y-8 md:space-y-10">
              {items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex space-x-4 md:space-x-6 border-b border-brand-earth/5 pb-8 md:pb-10 group animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-20 h-28 md:w-24 md:h-32 shrink-0 overflow-hidden rounded-xl md:rounded-2xl border border-brand-earth/10 shadow-md">
                    <img
                      src={
                        item.image
                          ? `${API_URL}${item.image}`
                          : "https://via.placeholder.com/150"
                      }
                      alt={item.name}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 md:py-1">
                    <div>
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <h3 className="font-serif font-bold text-brand-earth leading-tight text-base md:text-lg group-hover:text-brand-earth/70 transition-colors">
                          {item.name}
                        </h3>
                        <button
                          onClick={() =>
                            onRemove(
                              item.id,
                              item.selectedMeters,
                              item.selectedColor,
                            )
                          }
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-brand-earth/30 hover:bg-red-500 hover:text-white transition-all duration-300"
                        >
                          <i className="fa-regular fa-trash-can text-xs md:text-sm"></i>
                        </button>
                      </div>
                      <div className="flex wrap gap-1.5 md:gap-2 items-center">
                        <span className="text-[8px] md:text-[9px] font-black bg-brand-earth/5 text-brand-earth px-1.5 md:py-0.5 rounded uppercase tracking-widest border border-brand-earth/10">
                          {item.selectedMeters}m
                        </span>
                        <span className="text-[8px] md:text-[9px] font-black bg-brand-earth/5 text-brand-earth px-1.5 md:py-0.5 rounded uppercase tracking-widest border border-brand-earth/10">
                          {item.selectedColor}
                        </span>
                      </div>
                      {item.stitchingType && (
                        <div className="mt-2 flex flex-col text-brand-earth">
                          <div className="flex items-center gap-2 text-xs">
                            <i className="fa-solid fa-scissors"></i>
                            <span className="font-bold uppercase tracking-widest">
                              {item.stitchingType}
                            </span>
                          </div>
                          <span className="text-[10px] text-green-600 font-semibold">
                            + ₹{item.stitchingPrice}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-end mt-3 md:mt-4">
                      <div className="flex items-center bg-brand-earth/5 rounded-lg md:rounded-xl border border-brand-earth/10 p-0.5 md:p-1">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.selectedMeters,
                              item.selectedColor,
                              -1,
                            )
                          }
                          className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-brand-earth hover:bg-white rounded-md md:rounded-lg transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 md:px-3 text-[10px] md:text-xs font-black text-brand-earth min-w-[25px] md:min-w-[30px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.selectedMeters,
                              item.selectedColor,
                              1,
                            )
                          }
                          className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-brand-earth hover:bg-white rounded-md md:rounded-lg transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold text-brand-earth text-base md:text-lg tracking-tighter">
                        ₹
                        {(
                          (item.discountPrice || item.pricePerMeter) *
                          item.selectedMeters
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-brand-earth/10 p-6 md:p-8 bg-brand-white shrink-0 pb-safe">
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div className="flex justify-between items-center">
                <span className="text-brand-earth/40 uppercase tracking-[0.2em] font-bold text-[9px] md:text-[10px]">
                  Subtotal (Loom Rate)
                </span>
                <span className="font-bold text-brand-earth text-xl md:text-2xl tracking-tighter">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-earth/40 uppercase tracking-[0.2em] font-bold text-[9px] md:text-[10px]">
                  Dispatch
                </span>
                <span className="text-brand-earth font-black text-[8px] md:text-[9px] uppercase tracking-widest bg-brand-mint px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-brand-earth/10">
                  Complimentary Shipping
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-brand-earth text-brand-gold py-4 md:py-6 font-bold tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-[11px] hover:scale-[1.02] transition-all shadow-[0_20px_40px_rgba(25,32,46,0.15)] rounded-xl md:rounded-2xl flex items-center justify-center gap-4 md:gap-6 group relative overflow-hidden active:scale-95"
            >
              <span className="relative z-10">PROCEED TO CHECKOUT</span>
              <i className="fa-solid fa-arrow-right-long relative z-10 transition-transform group-hover:translate-x-2 text-brand-gold"></i>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700"></div>
            </button>
            <p className="text-center text-[8px] md:text-[9px] text-brand-earth/30 uppercase tracking-[0.2em] mt-4 md:mt-6 font-medium italic">
              Taxes loomed into final registry calculation
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
