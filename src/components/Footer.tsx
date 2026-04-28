import React from "react";
import logo from "../assests/Logo2.png"; // adjust path if needed

interface FooterProps {
  onHomeClick: () => void;
  onNewArrivalsClick: () => void;
  onCategoryClick: (category: string) => void;
  onSupportClick: () => void;
  onSizeGuideClick: () => void;
  onFabricCareClick: () => void;
  onShippingPolicyClick: () => void;
  onReturnsClick: () => void;
  onNewsletterClick: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onHomeClick,
  onNewArrivalsClick,
  onCategoryClick,
  onSupportClick,
  onSizeGuideClick,
  onFabricCareClick,
  onShippingPolicyClick,
  onReturnsClick,
  onNewsletterClick,
}) => {
  return (
    <footer className="bg-brand-earth text-brand-silver pt-12 md:pt-16 pb-8 border-t border-brand-mint/10 text-center md:text-left">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="space-y-4 premium-reveal flex flex-col items-center md:items-start">
          <button
            onClick={onHomeClick}
            className="flex items-center gap-1 text-lg md:text-xl font-serif font-semibold md:font-bold text-brand-gold hover:text-brand-mint hover:scale-110 uppercase tracking-widest transition-all duration-500 transform active:scale-95"
          >
            <img
              src={logo}
              alt="Linen Junction Logo"
              className="h-12 md:h-14 w-auto object-contain"
            />
            <span className="leading-none">LINEN JUNCTION</span>
          </button>

          {/* <h2
            onClick={onHomeClick}
            className="text-lg md:text-xl font-serif font-semibold md:font-bold text-brand-gold hover:text-brand-mint hover:scale-110 uppercase tracking-widest transition-all duration-500 transform inline-block cursor-pointer active:scale-95"
          >
            LINEN JUNCTION
          </h2> */}
          <p className="text-sm text-brand-silver/70 leading-relaxed max-w-xs md:max-w-none">
            Supplying the world's finest organic flax yardage. Sustainably
            loomed, ethically sourced, and designed for bespoke excellence.
          </p>
        </div>

        {/* <div className="premium-reveal stagger-1 flex flex-col items-center md:items-start">
          <h3
            onClick={() => onCategoryClick("")}
            className="text-brand-mint font-bold mb-4 uppercase text-sm tracking-widest cursor-pointer transition-all duration-500 transform hover:scale-110 inline-block active:scale-95"
          >
            THE VAULT
          </h3>
          <ul className="space-y-3 text-sm text-brand-silver/70">
            <li
              onClick={onNewArrivalsClick}
              className="hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer inline-block"
            >
              New Textures
            </li>
            <li
              onClick={() => onCategoryClick("Pure Linen")}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Pure Linen
            </li>
            <li
              onClick={() => onCategoryClick("Linen Blends")}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Linen Blends
            </li>
            <li
              onClick={() => onCategoryClick("Home Linen")}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Home Linen
            </li>
          </ul>
        </div> */}

        <div className="premium-reveal stagger-2 flex flex-col items-center md:items-start">
          <h3
            onClick={onSupportClick}
            className="text-brand-mint font-bold mb-4 uppercase text-sm tracking-widest cursor-pointer transition-all duration-500 transform hover:scale-110 inline-block active:scale-95"
          >
            SUPPORT
          </h3>
          <ul className="space-y-3 text-sm text-brand-silver/70">
            <li
              onClick={onSizeGuideClick}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Tailoring Guide
            </li>
            <li
              onClick={onFabricCareClick}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Fabric Care
            </li>
            <li
              onClick={onShippingPolicyClick}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Shipping Policy
            </li>
            <li
              onClick={onReturnsClick}
              className="block hover:text-brand-gold transition-all duration-300 transform hover:scale-[1.001] cursor-pointer"
            >
              Return & Refunds
            </li>
          </ul>
        </div>

        <div className="premium-reveal stagger-3 flex flex-col items-center md:items-start">
          <h3
            onClick={onNewsletterClick}
            className="text-brand-mint font-bold mb-4 uppercase text-sm tracking-widest cursor-pointer transition-all duration-500 transform hover:scale-110 inline-block active:scale-95"
          >
            JOURNAL
          </h3>
          <p className="text-xs mb-4 text-brand-silver/70">
            Join for exclusive early access to rare loomed yardage.
          </p>
          <div className="flex w-full max-w-xs md:max-w-none">
            <input
              type="email"
              placeholder="Your email"
              className="bg-white/5 border-brand-gold/30 border-b p-2 text-sm w-full focus:outline-none focus:border-brand-gold transition text-brand-white placeholder:text-brand-silver/40"
            />
            <button
              onClick={onNewsletterClick}
              className="bg-brand-gold text-brand-earth px-4 py-2 transition-all duration-300 transform hover:scale-[1.001] hover:bg-brand-mint active:scale-95"
            >
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-white/10 text-center text-[10px] text-brand-silver/40 uppercase tracking-widest">
        © 2026 Linen Junction Private Limited. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
