import { API_URL } from "../config";
import React, { useState, useEffect } from "react";
import { Product } from "../types";

interface HomeProps {
  onProductClick: (product: Product) => void;
  onQuickAdd: (product: Product, meters: string) => void;
  onShopAll: () => void;
  onCategoryClick: (category: string) => void;
  onOurStoryClick: () => void;
}

const Home: React.FC<HomeProps> = ({
  onProductClick,
  onShopAll,
  onCategoryClick,
  onOurStoryClick,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-20">Loading fabrics...</div>;
  }

  console.log(products);
  console.log("API URL:", API_URL);
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] bg-brand-white flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-80">
          <img
            src="https://images.pexels.com/photos/4814048/pexels-photo-4814048.jpeg"
            alt="Signature Forest Green Linen Fabric"
            className="w-full h-full object-cover scale-105 animate-[pulse_10s_infinite]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-white/95 via-brand-white/60 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16 w-full">
          <div className="max-w-2xl text-center md:text-left">
            <h4 className="text-brand-earth font-bold tracking-[0.3em] uppercase text-[10px] md:text-sm mb-4 premium-reveal stagger-1">
              Artisan Textile Mill
            </h4>
            <h1 className="text-3xl md:text-7xl font-serif text-brand-earth leading-tight mb-6 md:mb-8 premium-reveal stagger-2">
              The Raw Beauty of{" "}
              <span className="text-brand-earth italic underline decoration-brand-mint underline-offset-8">
                Pure Linen
              </span>{" "}
              Yardage.
            </h1>
            <p className="text-brand-earth/80 text-sm md:text-lg mb-8 md:mb-10 leading-relaxed font-light premium-reveal stagger-3">
              We provide the soul of the garment. Ethically woven organic flax
              for your bespoke tailoring and home projects.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 premium-reveal stagger-4">
              <button
                onClick={onShopAll}
                className="bg-brand-earth text-brand-white px-5 md:px-10 py-3 md:py-4 text-[10px] md:text-sm font-semibold md:font-bold tracking-widest transition-all duration-500 hover:bg-brand-earth/90 hover:scale-110 shadow-xl uppercase"
              >
                BROWSE FABRICS
              </button>
              <button
                onClick={onOurStoryClick}
                className="border-2 border-brand-earth text-brand-earth px-5 md:px-10 py-3 md:py-4 text-[10px] md:text-sm font-semibold md:font-bold tracking-widest transition-all duration-500 hover:bg-brand-mint hover:scale-110 shadow-md uppercase"
              >
                THE LOOM STORY
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section id="new-arrivals" className="py-12 md:py-24 bg-brand-silver/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 md:mb-16 gap-6 premium-reveal text-center md:text-left">
            <div>
              <h4 className="text-brand-earth font-bold tracking-widest text-[10px] md:text-sm uppercase mb-2">
                The Season's Weave
              </h4>
              <h2 className="text-xl md:text-3xl font-serif font-semibold md:font-bold text-brand-earth uppercase">
                New Fabric Textures
              </h2>
            </div>
            <button
              onClick={onShopAll}
              className="text-brand-earth font-bold tracking-widest text-[10px] md:text-sm transition-all duration-300 hover:text-brand-earth/60 inline-block uppercase border-b border-brand-earth"
            >
              EXPLORE FULL VAULT
            </button>
          </div>

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 overflow-x-auto md:overflow-visible pb-8 md:pb-0 scrollbar-hide snap-x snap-mandatory">
            {(products || [])
              .filter(
                (p) => !selectedCategory || p.category === selectedCategory,
              )
              .slice(0, 4)
              .map((product, idx) => (
                <div
                  key={product.id}
                  className="min-w-[32%] sm:min-w-[45%] md:min-w-0 snap-center group cursor-pointer premium-reveal text-center md:text-left"
                  onClick={() => onProductClick(product)}
                  style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                >
                  <div className="relative overflow-hidden mb-3 md:mb-4 aspect-[4/5] bg-brand-white rounded-lg shadow-sm group-hover:shadow-lg transition-shadow">
                    <img
                      src={
                        product.image
                          ? `${API_URL}${product.image}`
                          : "https://via.placeholder.com/300"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium text-brand-earth mb-1 transition duration-300 hover:text-brand-earth/70 uppercase text-xs md:text-base">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className="font-bold text-brand-earth text-xs md:text-base">
                      ₹
                      {(
                        product.discountPrice ||
                        product.pricePerMeter ||
                        0
                      ).toLocaleString()}{" "}
                      <span className="text-[9px] md:text-[10px] font-normal">
                        / meter
                      </span>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* <section
        id="categories"
        className="py-12 md:py-24 bg-brand-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center md:text-left mb-10 md:mb-16 premium-reveal">
            <h2 className="text-xl md:text-3xl font-serif font-semibold md:font-bold text-brand-earth mb-4 uppercase text-center">
              Browse by Fabric Type
            </h2>
            <div className="h-1 w-12 md:w-24 bg-brand-mint mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                title: "Pure Linen",
                img: "https://i.pinimg.com/736x/fe/81/8b/fe818be41732dadcdd3f8b531f1d0d0a.jpg",
              },
              {
                title: "Linen Blends",
                img: "https://i.pinimg.com/1200x/73/f2/2d/73f22da21363e6c4c0c39896a9d8f534.jpg",
              },
              {
                title: "Home Linen",
                img: "https://i.pinimg.com/736x/ec/2f/b2/ec2fb233a1cf53da6f5d2a5263986774.jpg",
              },
            ].map((cat, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedCategory(cat.title);
                  onCategoryClick(cat.title);
                }}
                className="group relative overflow-hidden cursor-pointer h-[300px] md:h-[400px] premium-reveal transition-transform duration-500"
                style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
              >
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-brand-earth/80 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center md:items-start md:justify-end md:text-left md:bottom-10 md:left-10 md:inset-auto">
                  <h3 className="text-xl md:text-2xl font-serif text-white mb-4 uppercase drop-shadow-lg">
                    {cat.title}
                  </h3>
                  <button className="text-brand-gold font-bold border-b-2 border-brand-mint pb-1 tracking-widest hover:text-brand-mint transition-all uppercase text-xs md:text-sm inline-block">
                    View Swatches
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Home;
