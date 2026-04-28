const API_URL = import.meta.env.VITE_API_URL;
import React, { useState, useEffect, useMemo } from "react";
import { Product } from "../types";

interface ShopProps {
  onProductClick: (product: Product) => void;
  onQuickAdd: (product: Product, meters: string) => void;
  initialCategory?: string;
  externalSearchQuery?: string;
  scrollToProductId?: string;
}

const Shop: React.FC<ShopProps> = ({
  onProductClick,
  initialCategory,
  externalSearchQuery = "",
  scrollToProductId,
}) => {
  const [category, setCategory] = useState(initialCategory || "All");
  const [weight, setWeight] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategory(initialCategory || "All");
  }, [initialCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (externalSearchQuery) setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/cloth-types`)
      .then((res) => res.json())
      .then((data) => {
        const names = data.map((c: any) => c.name);
        setCategories(["All", ...names]);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (scrollToProductId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-${scrollToProductId}`);
        if (element)
          element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scrollToProductId]);

  const hasFilters =
    category !== "All" || weight !== "All" || searchQuery !== "";

  const clearFilters = () => {
    setCategory("All");
    setWeight("All");
    setSearchQuery("");
    setSortBy("featured");
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (category !== "All") {
      result = result.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase().trim() === category.toLowerCase().trim(),
      );
      console.log(products);
    }

    if (weight !== "All") {
      result = result.filter((p) => p.weight === weight);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    if (sortBy === "low") {
      result.sort(
        (a, b) =>
          (a.discountPrice || a.pricePerMeter) -
          (b.discountPrice || b.pricePerMeter),
      );
    } else if (sortBy === "high") {
      result.sort(
        (a, b) =>
          (b.discountPrice || b.pricePerMeter) -
          (a.discountPrice || a.pricePerMeter),
      );
    }

    return result;
  }, [products, category, weight, sortBy, searchQuery]);

  return (
    <div className="min-h-screen py-6 md:py-12 overflow-hidden selection:bg-brand-mint selection:text-brand-earth">
      <div className="max-w-7xl px-6 md:px-12 lg:px-16 mx-auto">
        {/* Search Bar */}
        <div className="mb-6 md:mb-16 relative max-w-2xl mx-auto premium-reveal">
          <input
            type="text"
            placeholder="Search our Fabric Vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-white/80 backdrop-blur-md border-b-2 border-brand-earth p-3 md:p-6 text-base md:text-xl font-serif text-brand-earth focus:outline-none focus:border-brand-mint transition-all peer rounded-t-xl md:rounded-t-3xl shadow-sm"
          />
          <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-brand-earth">
            <i className="fa-solid fa-magnifying-glass text-base md:text-xl"></i>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-16">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-6 md:space-y-12 premium-reveal stagger-1 text-center md:text-left">
            <div className="flex justify-between items-end border-b-2 border-brand-earth pb-3 md:pb-4">
              <div className="w-full">
                <h3 className="text-brand-earth font-serif font-semibold md:font-bold text-lg md:text-2xl tracking-tight uppercase">
                  THE VAULT
                </h3>
                <p className="text-[7px] md:text-[9px] font-bold text-brand-earth/50 uppercase tracking-[0.3em] mt-1">
                  Refine Registry
                </p>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[8px] md:text-[10px] font-bold text-brand-earth underline uppercase tracking-widest hover:text-brand-mint transition-all shrink-0"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8">
              <section>
                <h4 className="text-[8px] md:text-[10px] font-bold text-brand-earth uppercase tracking-[0.25em] mb-3 md:mb-6">
                  By Weave Type
                </h4>
                <div className="space-y-2 md:space-y-4 flex flex-col items-center md:items-start">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`block w-full text-center md:text-left text-[10px] md:text-sm transition-all duration-300 transform hover:translate-x-1 relative md:pl-6 ${
                        category === cat
                          ? "text-brand-earth font-bold"
                          : "text-brand-earth/60 hover:text-brand-earth"
                      }`}
                    >
                      {category === cat && (
                        <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-brand-mint"></span>
                      )}
                      {cat}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-16 gap-3 md:gap-6 bg-brand-white/80 backdrop-blur-md p-4 md:p-8 rounded-xl md:rounded-[40px] border border-brand-silver premium-reveal stagger-2 shadow-sm text-center md:text-left">
              <p className="text-[7px] md:text-[10px] text-brand-earth font-bold uppercase tracking-[0.2em]">
                Registry Manifest: {filteredProducts.length} Swatches found
              </p>
              <div className="flex items-center space-x-4 md:space-x-8">
                <span className="text-[7px] md:text-[10px] text-brand-earth/50 font-bold uppercase tracking-widest hidden md:inline">
                  Catalog Order:
                </span>
                <div className="flex gap-3 md:gap-6">
                  {["featured", "low", "high"].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`text-[7px] md:text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${sortBy === sort ? "text-brand-earth border-brand-mint" : "text-brand-earth/40 border-transparent hover:text-brand-earth"}`}
                    >
                      {sort === "featured"
                        ? "Featured"
                        : sort === "low"
                          ? "Price +"
                          : "Price -"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex md:grid md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12 overflow-x-auto md:overflow-visible pb-8 md:pb-0 scrollbar-hide snap-x snap-mandatory">
              {filteredProducts.map((product, idx) => {
                return (
                  <div
                    key={product.id}
                    id={`product-${product.id}`}
                    className="min-w-[32%] sm:min-w-[45%] md:min-w-0 snap-center group cursor-pointer relative premium-reveal text-center md:text-left"
                    style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                    onClick={() => {
                      console.log("Clicked product:", product);
                      onProductClick(product);
                    }}
                  >
                    <div className="relative overflow-hidden mb-3 md:mb-6 aspect-[3/4] bg-brand-white rounded-xl md:rounded-[32px] shadow-sm transition-all duration-700 group-hover:shadow-2xl border border-brand-silver">
                      <img
                        src={
                          product.image
                            ? `${API_URL}${product.image}`
                            : "https://via.placeholder.com/300"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover transition duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-brand-earth/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4 md:p-8 backdrop-blur-[2px]">
                        <p className="text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-6 translate-y-4 group-hover:translate-y-0 transition-transform delay-75">
                          Bespoke Options Available
                        </p>
                        {/* <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 translate-y-4 group-hover:translate-y-0 transition-transform delay-100">
                          {(product.availableLengths || ["1", "2.5", "5"]).map(
                            (len) => (
                              <button
                                key={len}
                                disabled={stock === 0}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // if (stock === 0) {
                                  //   alert("Out of stock");
                                  //   return;
                                  // }

                                  onQuickAdd(product, len);
                                }}
                                className={`w-10 h-8 md:w-14 md:h-11 ${
                                  stock === 0
                                    ? "opacity-40 cursor-not-allowed"
                                    : ""
                                } bg-brand-white/20 hover:bg-brand-mint hover:text-brand-earth text-white border border-white/30 text-[8px] md:text-[10px] font-bold flex items-center justify-center transition-all duration-300 backdrop-blur-md rounded-lg md:rounded-xl shadow-lg`}
                              >

                                {len}
                              </button>
                            ),
                          )}
                        </div> */}
                      </div>
                    </div>
                    <div className="text-center md:text-left px-1 md:px-2">
                      <h3 className="font-serif text-sm md:text-2xl text-brand-earth mb-1 md:mb-2 leading-tight uppercase">
                        {product.name}
                      </h3>
                      {/* <p className="text-xs text-gray-500">
                        {stock > 0 ? `${stock} available` : "Out of stock"}
                      </p> */}
                      <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-3">
                        <span className="font-bold text-brand-earth text-xs md:text-lg">
                          ₹
                          {(
                            product.discountPrice || product.pricePerMeter
                          ).toLocaleString()}{" "}
                          <span className="text-[8px] md:text-[10px] font-normal text-brand-earth/50">
                            / meter
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
