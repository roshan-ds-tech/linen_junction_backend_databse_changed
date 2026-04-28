import React, { useState } from "react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import logo from "../assests/Logo2.png";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onHomeClick: () => void;
  onShopClick: (category?: string) => void;
  onOrdersClick: () => void;
  onSearchSubmit: (query: string) => void;
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onCartClick,
  onAdminClick,
  onHomeClick,
  onShopClick,
  onOrdersClick,
  onSearchSubmit,
  isAuthenticated,
  user,
  onLogout,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-brand-earth text-brand-mint shadow-md border-b border-brand-mint/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-brand-mint hover:text-brand-gold transition-colors"
              >
                <i
                  className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars-staggered"} text-xl`}
                ></i>
              </button>
            </div>

            {/* Logo & Desktop Nav */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <button
                  onClick={onHomeClick}
                  className="flex items-center gap-1.5 text-base md:text-xl font-serif font-semibold md:font-bold tracking-wide text-brand-gold hover:text-brand-mint hover:scale-105 transition-all duration-500 transform active:scale-95 premium-reveal"
                >
                  <img
                    src={logo}
                    alt="Linen Junction Logo"
                    className="h-15 md:h-15 w-auto object-contain"
                  />
                  <span>LINEN JUNCTION</span>
                </button>
              </div>
              <div className="hidden lg:flex space-x-6 text-[11px] font-bold tracking-[0.2em] premium-reveal stagger-1 relative">
                <div className="relative group">
                  <button
                    onClick={() => onShopClick()}
                    onMouseEnter={() => setHoveredItem("all")}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="text-brand-white hover:text-brand-gold transition-all duration-300 uppercase py-2"
                  >
                    ALL FABRICS
                  </button>
                  <AnimatePresence>
                    {hoveredItem === "all" && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="absolute top-full left-0 mt-4 w-80 bg-brand-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-none z-50 border border-brand-earth/5"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src="https://images.pexels.com/photos/4814048/pexels-photo-4814048.jpeg"
                            alt="All Fabrics"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-earth/40 to-transparent"></div>
                          <div className="absolute bottom-3 left-4">
                            <span className="bg-brand-mint/90 text-brand-earth text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Seasonal Vault
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h5 className="text-brand-earth font-serif text-lg mb-2">
                            The Full Artisan Vault
                          </h5>
                          <p className="text-brand-earth/70 text-xs leading-relaxed mb-4">
                            Explore our curated collection of over 120+ unique
                            linen textures, from heavy upholstery to delicate
                            sheer weaves.
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-brand-earth/5">
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-earth-asia text-brand-mint text-[10px]"></i>
                              <span className="text-[9px] font-bold text-brand-earth/60 uppercase tracking-tighter">
                                Global Shipping
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-leaf text-brand-mint text-[10px]"></i>
                              <span className="text-[9px] font-bold text-brand-earth/60 uppercase tracking-tighter">
                                Ethically Woven
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <button
                    onClick={() => onShopClick("Pure Linen")}
                    onMouseEnter={() => setHoveredItem("pure")}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="text-brand-white hover:text-brand-gold transition-all duration-300 uppercase py-2"
                  >
                    PURE LINEN
                  </button>
                  <AnimatePresence>
                    {hoveredItem === "pure" && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="absolute top-full left-0 mt-4 w-80 bg-brand-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-none z-50 border border-brand-earth/5"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src="https://i.pinimg.com/736x/fe/81/8b/fe818be41732dadcdd3f8b531f1d0d0a.jpg"
                            alt="Pure Linen"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-earth/40 to-transparent"></div>
                          <div className="absolute bottom-3 left-4">
                            <span className="bg-brand-gold/90 text-brand-earth text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                              100% Organic
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h5 className="text-brand-earth font-serif text-lg mb-2">
                            Signature Pure Linen
                          </h5>
                          <p className="text-brand-earth/70 text-xs leading-relaxed mb-4">
                            Our flagship 160 GSM organic flax. Pre-washed for a
                            soft, lived-in feel from the very first touch.
                          </p>
                          <div className="space-y-2 pt-3 border-t border-brand-earth/5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-brand-earth/40 uppercase">
                                Breathability
                              </span>
                              <div className="h-1 w-24 bg-brand-mint/20 rounded-full overflow-hidden">
                                <div className="h-full w-[95%] bg-brand-mint"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-brand-earth/40 uppercase">
                                Durability
                              </span>
                              <div className="h-1 w-24 bg-brand-mint/20 rounded-full overflow-hidden">
                                <div className="h-full w-[85%] bg-brand-mint"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <button
                    onClick={() => onShopClick("Linen Blends")}
                    onMouseEnter={() => setHoveredItem("blends")}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="text-brand-white hover:text-brand-gold transition-all duration-300 uppercase py-2"
                  >
                    BLENDS
                  </button>
                  <AnimatePresence>
                    {hoveredItem === "blends" && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="absolute top-full left-0 mt-4 w-80 bg-brand-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-none z-50 border border-brand-earth/5"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src="https://i.pinimg.com/1200x/73/f2/2d/73f22da21363e6c4c0c39896a9d8f534.jpg"
                            alt="Linen Blends"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-earth/40 to-transparent"></div>
                          <div className="absolute bottom-3 left-4">
                            <span className="bg-brand-earth text-brand-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Performance Mix
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h5 className="text-brand-earth font-serif text-lg mb-2">
                            Artisan Linen Blends
                          </h5>
                          <p className="text-brand-earth/70 text-xs leading-relaxed mb-4">
                            Linen merged with premium cotton and silk. Designed
                            for high-frequency wear and easy maintenance.
                          </p>
                          <ul className="text-[10px] space-y-1 text-brand-earth/80 font-medium">
                            <li className="flex items-center gap-2">
                              <i className="fa-solid fa-check text-brand-mint"></i>{" "}
                              Wrinkle Resistant
                            </li>
                            <li className="flex items-center gap-2">
                              <i className="fa-solid fa-check text-brand-mint"></i>{" "}
                              Machine Washable
                            </li>
                            <li className="flex items-center gap-2">
                              <i className="fa-solid fa-check text-brand-mint"></i>{" "}
                              Enhanced Drape
                            </li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <button
                    onClick={() => onShopClick("Home Linen")}
                    onMouseEnter={() => setHoveredItem("home")}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="text-brand-white hover:text-brand-gold transition-all duration-300 uppercase py-2"
                  >
                    HOME LINEN
                  </button>
                  <AnimatePresence>
                    {hoveredItem === "home" && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="absolute top-full left-0 mt-4 w-80 bg-brand-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-none z-50 border border-brand-earth/5"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src="https://i.pinimg.com/736x/ec/2f/b2/ec2fb233a1cf53da6f5d2a5263986774.jpg"
                            alt="Home Linen"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-earth/40 to-transparent"></div>
                          <div className="absolute bottom-3 left-4">
                            <span className="bg-brand-mint/90 text-brand-earth text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Living & Decor
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h5 className="text-brand-earth font-serif text-lg mb-2">
                            Artisan Home Linen
                          </h5>
                          <p className="text-brand-earth/70 text-xs leading-relaxed mb-4">
                            Transform your sanctuary with antibacterial,
                            moisture-wicking bedding and table textiles.
                          </p>
                          <div className="flex gap-2">
                            <span className="text-[8px] border border-brand-earth/20 px-2 py-1 rounded-md text-brand-earth/60 font-bold uppercase">
                              Bedding
                            </span>
                            <span className="text-[8px] border border-brand-earth/20 px-2 py-1 rounded-md text-brand-earth/60 font-bold uppercase">
                              Curtains
                            </span>
                            <span className="text-[8px] border border-brand-earth/20 px-2 py-1 rounded-md text-brand-earth/60 font-bold uppercase">
                              Tableware
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Action Icons */}
            <div className="flex items-center space-x-5 premium-reveal stagger-3">
              {isAuthenticated && user?.role === "admin" && (
                <div className="relative">
                  <button
                    onClick={onAdminClick}
                    onMouseEnter={() => setHoveredItem("admin")}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="hidden xl:block text-[9px] border border-brand-mint/40 px-5 py-2 rounded-full hover:bg-brand-mint hover:text-brand-earth hover:scale-110 font-black tracking-[0.2em] transition-all duration-300 uppercase mr-2"
                  >
                    ADMIN CONSOLE
                  </button>
                  <AnimatePresence>
                    {hoveredItem === "admin" && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="absolute top-full right-0 mt-4 w-72 bg-brand-earth border border-brand-mint/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 pointer-events-none z-50"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-brand-mint/10 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-screwdriver-wrench text-brand-gold text-xl"></i>
                          </div>
                          <div>
                            <h5 className="text-brand-gold font-bold text-[11px] tracking-widest uppercase">
                              Management Hub
                            </h5>
                            <span className="text-brand-mint/40 text-[8px] uppercase font-black">
                              Secure Access
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-brand-mint/60">
                              Inventory Health
                            </span>
                            <span className="text-brand-mint font-bold">
                              98%
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-brand-mint/60">
                              Active Tailoring
                            </span>
                            <span className="text-brand-mint font-bold">
                              12 Units
                            </span>
                          </div>
                        </div>
                        <p className="mt-4 text-brand-mint/50 text-[10px] leading-relaxed italic">
                          "Precision in every weave, control in every order."
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={toggleSearch}
                className="p-2 hover:text-brand-gold transition-all duration-300"
                aria-label="Search Vault"
              >
                <i className="fa-solid fa-magnifying-glass text-lg"></i>
              </button>

              <div className="relative group">
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      setIsUserMenuOpen(!isUserMenuOpen);
                    } else {
                      onOrdersClick();
                    }
                  }}
                  onMouseEnter={() => setHoveredItem("profile")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`p-2 hover:text-brand-gold transition-all duration-300 flex items-center gap-2 ${isAuthenticated ? "text-brand-gold" : ""}`}
                  aria-label="User Account"
                >
                  <i className="fa-regular fa-circle-user text-xl"></i>
                  {isAuthenticated && (
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">
                      {user?.name.split(" ")[0]}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {hoveredItem === "profile" && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.98 }}
                      className="absolute top-full right-0 mt-4 w-64 bg-brand-earth border border-brand-mint/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 pointer-events-none z-50"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
                          <i className="fa-regular fa-circle-user text-brand-gold text-2xl"></i>
                        </div>
                        <div>
                          <h5 className="text-brand-gold font-bold text-[11px] tracking-widest uppercase">
                            {isAuthenticated
                              ? user?.name.split(" ")[0]
                              : "Artisan Profile"}
                          </h5>
                          <p className="text-brand-mint/40 text-[8px] uppercase font-black">
                            {isAuthenticated
                              ? "Loyalty Member"
                              : "Guest Access"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 border-t border-brand-mint/10 pt-3">
                        <div className="flex items-center gap-2 text-[10px] text-brand-mint/70">
                          <i className="fa-solid fa-clock-rotate-left text-[8px]"></i>
                          <span>Order History</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-brand-mint/70">
                          <i className="fa-solid fa-ruler text-[8px]"></i>
                          <span>Saved Measurements</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAuthenticated && isUserMenuOpen && (
                  <div className="absolute right-0 mt-4 w-48 bg-brand-earth border border-brand-mint/10 rounded-2xl shadow-2xl py-2 overflow-hidden animate-fadeIn">
                    <button
                      onClick={() => {
                        onOrdersClick();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-mint hover:bg-brand-gold/10 transition"
                    >
                      Order History
                    </button>
                    <button
                      onClick={() => {
                        onLogout?.();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={onCartClick}
                  onMouseEnter={() => setHoveredItem("cart")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative p-2 hover:text-brand-gold transition-all duration-300"
                  aria-label="Shopping Cart"
                >
                  <i className="fa-solid fa-cart-shopping text-lg"></i>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-brand-gold text-brand-earth text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {hoveredItem === "cart" && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.98 }}
                      className="absolute top-full right-0 mt-4 w-72 bg-brand-earth border border-brand-mint/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 pointer-events-none z-50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-brand-gold font-bold text-[11px] tracking-widest uppercase">
                          Artisan Bag
                        </h5>
                        <span className="bg-brand-gold text-brand-earth text-[9px] font-black px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      </div>

                      {cartCount > 0 ? (
                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] text-brand-mint/60">
                            <span>Estimated Total</span>
                            <span className="text-brand-mint font-bold">
                              ₹{(cartCount * 1250).toLocaleString()}*
                            </span>
                          </div>
                          <p className="text-brand-mint/40 text-[8px] italic leading-tight">
                            *Final price calculated at checkout based on yardage
                            selections.
                          </p>
                          <div className="pt-3 border-t border-brand-mint/10 flex items-center gap-2 text-brand-gold text-[9px] font-bold uppercase tracking-widest">
                            <span>Proceed to Secure Checkout</span>
                            <i className="fa-solid fa-arrow-right-long"></i>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fa-solid fa-basket-shopping text-brand-mint/20 text-3xl mb-2"></i>
                          <p className="text-brand-mint/60 text-[10px]">
                            Your bag is empty. Start your artisan journey by
                            exploring our vault.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Sidebar */}
        <div
          className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          <div
            className="absolute inset-0 bg-brand-earth/60 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div
            className={`absolute left-0 top-0 h-full w-[80%] max-w-sm bg-brand-earth border-r border-brand-mint/10 p-6 md:p-8 transition-transform duration-500 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex flex-col space-y-6 md:space-y-8 mt-12">
              <button
                onClick={() => {
                  onShopClick();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-brand-white hover:text-brand-gold text-base md:text-lg font-bold tracking-widest uppercase transition-colors"
              >
                ALL FABRICS
              </button>
              <button
                onClick={() => {
                  onShopClick("Pure Linen");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-brand-white hover:text-brand-gold text-base md:text-lg font-bold tracking-widest uppercase transition-colors"
              >
                PURE LINEN
              </button>
              <button
                onClick={() => {
                  onShopClick("Linen Blends");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-brand-white hover:text-brand-gold text-base md:text-lg font-bold tracking-widest uppercase transition-colors"
              >
                BLENDS
              </button>
              <button
                onClick={() => {
                  onShopClick("Home Linen");
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-brand-white hover:text-brand-gold text-base md:text-lg font-bold tracking-widest uppercase transition-colors"
              >
                HOME LINEN
              </button>

              <div className="pt-8 border-t border-brand-mint/10 space-y-6">
                <button
                  onClick={() => {
                    onOrdersClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-4 text-brand-mint hover:text-brand-gold font-bold tracking-widest uppercase text-sm"
                >
                  <i className="fa-regular fa-circle-user text-xl"></i>
                  {isAuthenticated ? "My Account" : "Login / Register"}
                </button>
                {isAuthenticated && user?.role === "admin" && (
                  <button
                    onClick={() => {
                      onAdminClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-4 text-brand-mint hover:text-brand-gold font-bold tracking-widest uppercase text-sm"
                  >
                    <i className="fa-solid fa-screwdriver-wrench text-xl"></i>
                    Admin Console
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <div
          className={`absolute top-full left-0 w-full bg-brand-earth/95 backdrop-blur-xl border-t border-brand-mint/10 transition-all duration-500 ease-in-out transform ${isSearchOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search the Artisan Fabric Vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-b-2 border-brand-mint/30 p-3 md:p-4 text-xl md:text-2xl font-serif text-brand-white focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-white/20"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-mint hover:scale-[1.05] transition-transform"
              >
                <i className="fa-solid fa-arrow-right-long text-2xl"></i>
              </button>
            </form>
          </div>
        </div>
      </nav>
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsSearchOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
