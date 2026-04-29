import { API_URL } from "../config";
import React, { useState, useRef } from "react";
import { Product, CartItem, Measurements } from "../types";
import { STITCHING_OPTIONS } from "../utils/stitchingConfig";

interface ProductDetailsProps {
  product: Product;
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onAddToCart,
  onBack,
}) => {
  const [selectedMeters, setSelectedMeters] = useState<string>("");
  const [mainImage, setMainImage] = useState(product.image || "");
  const [addTailoring, setAddTailoring] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>({});
  const [quantity] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [isZoomLocked, setIsZoomLocked] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [selectedStitching, setSelectedStitching] = useState<any>(null);
  // const handleAddToCart = async () => {
  //   const meters = parseFloat(selectedMeters);
  //   <input
  //     type="number"
  //     step="0.1"
  //     min="0.5"
  //     value={selectedMeters}
  //     onChange={(e) => {
  //       setSelectedMeters(e.target.value);
  //     }}
  //   />;
  //   if (addTailoring) {
  //     if (
  //       !measurements.chest ||
  //       !measurements.waist ||
  //       !measurements.shoulder ||
  //       !measurements.length
  //     ) {
  //       alert("Please fill all required measurements");
  //       return;
  //     }
  //   }

  //   if (!meters || meters <= 0) {
  //     alert("Enter valid fabric length");
  //     return;
  //   }

  // 🛒 Add to cart
  //   onAddToCart({
  //     ...product,
  //     selectedMeters: meters,
  //     selectedColor, // 🔥 ADD THIS
  //     addTailoringService: addTailoring,
  //     measurements: addTailoring
  //       ? {
  //           chest: measurements.chest,
  //           waist: measurements.waist,
  //           shoulder: measurements.shoulder,
  //           length: measurements.length,
  //         }
  //       : undefined,
  //     quantity,
  //   });
  // };
  // 🔥 Deduct inventory
  //   await fetch(`${API_URL}/api/inventory/deduct`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       productId: product.id,
  //       color: selectedColor,
  //       length: selectedMeters,
  //       quantity: 1,
  //     }),
  //   });
  // };

  // const updateMeasurement = (field: keyof Measurements, value: string) => {
  //   setMeasurements((prev) => ({ ...prev, [field]: value }));
  // };

  // const handleMouseMove = (e: React.MouseEvent) => {
  //   if (!imageRef.current || isZoomLocked) return;
  //   const { left, top, width, height } =
  //     imageRef.current.getBoundingClientRect();
  //   const x = ((e.clientX - left) / width) * 100;
  //   const y = ((e.clientY - top) / height) * 100;
  //   setZoomPos({ x, y });
  // };

  const handleAddToCart = () => {
    const meters = parseFloat(selectedMeters);

    // stop if empty
    if (!meters || meters <= 0) return;

    if (addTailoring) {
      if (
        !measurements.chest ||
        !measurements.waist ||
        !measurements.shoulder ||
        !measurements.length
      ) {
        alert("Please fill all measurements");
        return;
      }

      // 🔥 THIS IS THE MISSING PART
      if (!selectedStitching) {
        alert("Please select stitching type");
        return;
      }
    }

    onAddToCart({
      ...product,
      product_id: product.id,
      name: product.name,
      selectedMeters: meters,
      addTailoringService: addTailoring,

      // 🔥 NOW SAFE (no null anymore)
      stitchingType: selectedStitching?.label,
      stitchingPrice: selectedStitching?.price,

      measurements: addTailoring
        ? {
            chest: measurements.chest,
            waist: measurements.waist,
            shoulder: measurements.shoulder,
            length: measurements.length,
            notes: measurements.notes || "",
          }
        : undefined,

      quantity,
    });
  };

  const updateMeasurement = (field: keyof Measurements, value: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current || isZoomLocked) return;

    const { left, top, width, height } =
      imageRef.current.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPos({ x, y });
  };

  return (
    <div className="bg-brand-white min-h-screen py-6 md:py-12 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <button
          onClick={onBack}
          className="flex items-center justify-center md:justify-start space-x-2 text-brand-earth hover:text-brand-gold transition mb-6 md:mb-8 text-[10px] md:text-sm font-bold tracking-widest uppercase w-full md:w-auto"
        >
          <i className="fa-solid fa-arrow-left-long"></i>
          <span>BACK TO TEXTILE VAULT</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-16">
          {/* Image Gallery */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6">
            {product.images && product.images.length > 1 && (
              <div className="flex md:flex-col flex-row gap-3 md:gap-4 order-2 md:order-1 overflow-x-auto md:overflow-y-auto py-2 px-1 custom-scroll max-h-[400px] md:max-h-[600px] md:w-24 shrink-0"></div>
            )}
            <div className="flex-1 order-1 md:order-2">
              <div
                ref={imageRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                  setIsHovering(false);
                  if (!isZoomLocked) setZoomPos({ x: 50, y: 50 });
                }}
                onClick={() => setIsZoomLocked(!isZoomLocked)}
                className={`relative group overflow-hidden aspect-[4/5] bg-white rounded-xl md:rounded-2xl shadow-xl select-none transition-shadow duration-300 ${isZoomLocked ? "cursor-zoom-out shadow-2xl" : "cursor-crosshair"}`}
              >
                <img
                  src={
                    mainImage
                      ? `${API_URL}${mainImage}`
                      : "https://via.placeholder.com/500"
                  }
                  alt={product.name}
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform:
                      isHovering || isZoomLocked ? "scale(2.5)" : "scale(1)",
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out"
                />
                <div
                  className={`absolute top-4 right-4 bg-brand-earth/90 backdrop-blur-md text-brand-gold px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-black tracking-widest uppercase flex items-center gap-2 md:gap-3 transition-all duration-500 ${isZoomLocked ? "opacity-100" : "opacity-0"}`}
                >
                  <i className="fa-solid fa-lock-open text-[9px] md:text-[11px] animate-pulse"></i>
                  <span>Detail Locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-brand-silver font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1">
              {product.category}
            </h4>
            <h1 className="text-2xl md:text-4xl font-serif font-semibold md:font-bold text-brand-earth mb-3 md:mb-4">
              {product.name}
            </h1>

            <div className="flex items-center justify-center md:justify-start space-x-4 mb-6 md:mb-8">
              <span className="text-xl md:text-2xl font-bold text-brand-earth">
                ₹
                {(
                  product.discountPrice || product.pricePerMeter
                ).toLocaleString()}{" "}
                <span className="text-[10px] md:text-xs font-normal text-brand-silver">
                  / meter
                </span>
              </span>
            </div>

            <p className="text-brand-earth/80 leading-relaxed mb-8 md:mb-10 text-xs md:text-sm italic font-light">
              "{product.description}"
            </p>

            <div className="space-y-6 md:space-y-8">
              {/* Color Selection */}
              {/* <div>
                <h5 className="text-[9px] md:text-[10px] font-bold text-brand-earth tracking-widest uppercase mb-3 md:mb-4">
                  Select Shade:{" "}
                  <span className="text-brand-gold ml-2">{selectedColor}</span>
                </h5>
                <div className="flex justify-center md:justify-start space-x-2 md:space-x-3">
                  {(product.colors || ["Default"]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition ${selectedColor === color ? "border-brand-gold scale-110" : "border-transparent"}`}
                    >
                      <div
                        className="w-full h-full rounded-full border border-brand-earth/10"
                        style={{
                          backgroundColor: color.toLowerCase().replace(" ", ""),
                        }}
                      ></div>
                    </button>
                  ))}
                </div>
              </div> */}

              <div className="space-y-1">
                <p className="text-sm text-brand-earth">
                  Selected Fabric: <b>{selectedMeters} meters</b>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 2.5"
                  value={selectedMeters}
                  onChange={(e) => setSelectedMeters(e.target.value)}
                  className="w-44 px-4 py-3 rounded-xl border border-gray-300 
             focus:outline-none focus:ring-2 focus:ring-black 
             focus:border-black text-sm font-medium 
             placeholder-gray-400 transition-all"
                />
                <span className="text-sm text-gray-500">meters</span>
              </div>
              {/* Length Selection */}
              {/* <div>
                <h5 className="text-[9px] md:text-[10px] font-bold text-brand-earth tracking-widest uppercase mb-3 md:mb-4">
                  Select Length (Meters):
                </h5>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                  {(product.availableLengths || ["1", "2.5", "5"]).map(
                    (len) => (
                      <button
                        key={len}
                        onClick={() => setSelectedMeters(parseFloat(len))}
                        className={`px-4 md:px-6 py-1.5 md:py-2 border text-[10px] md:text-sm font-bold transition-all ${selectedMeters === parseFloat(len) ? "bg-brand-earth text-brand-white" : "bg-white text-brand-earth hover:border-brand-gold"}`}
                      >
                        {len}
                      </button>
                    ),
                  )}
                </div>
              </div> */}

              {/* Tailoring Add-on */}
              <div
                className={`bg-brand-silver/10 p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all ${addTailoring ? "border-brand-gold shadow-lg" : "border-brand-silver/30"}`}
              >
                <label className="flex items-start gap-3 md:gap-4 cursor-pointer mb-4 md:mb-6">
                  <input
                    type="checkbox"
                    checked={addTailoring}
                    onChange={() => setAddTailoring(!addTailoring)}
                    className="mt-1 w-4 h-4 md:w-5 md:h-5 accent-brand-gold rounded border-brand-silver"
                  />
                  {addTailoring && (
                    <div className="mt-4">
                      <label className="text-xs font-bold uppercase text-brand-earth">
                        Select Stitching Type
                      </label>

                      <select
                        onChange={(e) => {
                          const option = STITCHING_OPTIONS.find(
                            (o) => o.label === e.target.value,
                          );
                          setSelectedStitching(option);
                        }}
                        className="w-full mt-2 p-2 border rounded"
                      >
                        <option value="">Choose stitching</option>
                        {STITCHING_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label} (+₹{opt.price})
                          </option>
                        ))}
                      </select>

                      {selectedStitching && (
                        <p className="text-green-600 text-sm mt-2">
                          Stitching Cost: ₹{selectedStitching.price}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="text-left">
                    <h5 className="text-[9px] md:text-[10px] font-bold text-brand-earth uppercase tracking-widest">
                      Bespoke Tailoring Service (+ additional cost)
                    </h5>

                    <p className="text-[10px] md:text-xs text-brand-earth/60 mt-1 leading-relaxed">
                      Opt for our artisan tailoring. Provide your desired
                      measurements below for a perfect fit.
                    </p>
                  </div>
                </label>

                {addTailoring && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-fadeIn">
                    {["chest", "waist", "hips", "shoulder", "length"].map(
                      (field) => (
                        <div key={field} className="space-y-1">
                          <label className="text-[8px] md:text-[9px] font-bold text-brand-silver uppercase tracking-widest">
                            {field} (inches)
                          </label>
                          <input
                            type="text"
                            value={
                              (measurements as Record<string, string>)[field] ||
                              ""
                            }
                            onChange={(e) =>
                              updateMeasurement(
                                field as keyof Measurements,
                                e.target.value,
                              )
                            }
                            placeholder="00.0"
                            className="w-full bg-white border-b border-brand-gold/30 p-1.5 md:p-2 text-[10px] md:text-xs focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                      ),
                    )}
                    <div className="col-span-full space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-brand-silver uppercase tracking-widest">
                        Additional Notes
                      </label>
                      <textarea
                        value={measurements.notes || ""}
                        onChange={(e) =>
                          updateMeasurement("notes", e.target.value)
                        }
                        placeholder="e.g. Loose fit around sleeves..."
                        className="w-full bg-white border border-brand-silver/20 rounded-lg p-2 text-[10px] md:text-xs h-12 md:h-16 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <div className="pt-2 md:pt-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-brand-earth text-brand-white font-bold tracking-[0.2em] py-4 md:py-5 rounded-lg md:rounded-xl shadow-xl hover:-translate-y-1 transition-all uppercase group text-xs md:text-base"
                >
                  ADD TO CART —{" "}
                  <span className="text-brand-gold group-hover:text-brand-mint transition-colors">
                    ₹
                    {(
                      (product.discountPrice || product.pricePerMeter) *
                        (parseFloat(selectedMeters) || 0) +
                      (addTailoring ? selectedStitching?.price || 0 : 0)
                    ).toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetails;
