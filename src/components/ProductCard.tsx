import React from 'react';
import { imageUrl } from '../config';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-brand-silver/30"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={product.image ? imageUrl(product.image) : "https://placehold.co/400x500?text=No+Image"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-brand-earth/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <span className="bg-white text-brand-earth px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            View Details
          </span>
        </div>
        {product.discountPrice && (
          <div className="absolute top-4 left-4 bg-brand-gold text-brand-earth px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
            Sale
          </div>
        )}
      </div>
      <div className="p-6 md:p-8 text-center">
        <h4 className="text-[9px] md:text-[10px] font-bold text-brand-silver uppercase tracking-[0.3em] mb-2">{product.category}</h4>
        <h3 className="text-lg md:text-xl font-serif font-bold text-brand-earth mb-3 group-hover:text-brand-gold transition-colors">{product.name}</h3>
        <div className="flex items-center justify-center space-x-3">
          {product.discountPrice ? (
            <>
              <span className="text-brand-silver line-through text-xs">₹{product.pricePerMeter.toLocaleString()}</span>
              <span className="text-brand-earth font-bold text-base">₹{product.discountPrice.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-brand-earth font-bold text-base">₹{product.pricePerMeter.toLocaleString()}</span>
          )}
          <span className="text-[10px] text-brand-silver uppercase font-bold tracking-widest">/ m</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
