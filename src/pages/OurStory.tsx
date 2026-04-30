import React from "react";
import { motion } from "motion/react";
import storyImage from "../assests/about.png";

interface OurStoryProps {
  onExploreArchive?: () => void;
  onBeginJourney?: () => void;
}

const OurStory: React.FC<OurStoryProps> = ({
  onExploreArchive,
  onBeginJourney,
}) => {
  return (
    <div className="bg-brand-white min-h-screen py-12 md:py-24 px-6 md:px-12 lg:px-16 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h4 className="text-[10px] md:text-xs font-bold text-brand-gold uppercase tracking-[0.5em]">
            Linen Junction
          </h4>
          <h1 className="text-4xl md:text-7xl font-serif font-bold text-brand-earth tracking-tighter leading-none">
            OUR{" "}
            <span className="italic font-normal text-brand-earth/50">
              STORY
            </span>
          </h1>
          <div className="w-24 h-1 bg-brand-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center mb-32">
          <div className="relative group">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-brand-gold/10 rounded-full pointer-events-none transition-all duration-700 group-hover:scale-110"></div>
            <div className="aspect-[3/4] rounded-[48px] overflow-hidden shadow-2xl border border-brand-silver/30 relative z-10">
              <img
                src={storyImage}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt="SSV Enterprises Store"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-brand-earth p-8 rounded-[32px] text-brand-gold shadow-2xl z-20 hidden lg:block animate-bounce-slow">
              <p className="text-4xl font-serif font-bold">1997</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1">
                Est. Registry
              </p>
            </div>
          </div>
          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-earth leading-tight">
              The Loom's <span className="text-brand-gold">Legacy</span>
            </h2>
            <p className="text-brand-earth/70 leading-relaxed text-base md:text-lg lg:text-xl italic font-light">
              "In the heart of the textile district, Linen Junction was born
              from a singular vision: to bridge the gap between raw, organic
              flax and the refined elegance of bespoke tailoring."
            </p>
            <p className="text-brand-earth/60 leading-relaxed text-sm md:text-base lg:text-lg">
              Rooted in the legacy of fine textiles, Linen Junction has been
              curating authentic men’s fabrics since 1997. From premium shirting
              and suiting to refined linen and cotton ensembles, every
              collection reflects a commitment to quality, craftsmanship, and
              timeless style. Recognized for exceptional customer satisfaction,
              we continue to serve those who value precision, authenticity, and
              enduring elegance.{" "}
            </p>
            <div className="pt-6">
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExploreArchive}
                className="bg-brand-earth text-brand-gold px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition shadow-xl"
              >
                Explore The Archive
              </motion.button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 mb-32">
          {[
            {
              title: "Organic Sourcing",
              icon: "fa-leaf",
              desc: "Every thread in our registry is sourced from certified organic flax farms, ensuring minimal environmental impact.",
            },
            {
              title: "Artisan Craft",
              icon: "fa-scissors",
              desc: "Our tailoring unit consists of master artisans with decades of experience in the delicate art of linen manipulation.",
            },
            {
              title: "Timeless Design",
              icon: "fa-clock",
              desc: "We reject fast fashion. Our pieces are designed to age gracefully, becoming softer and more personal with every wear.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-brand-silver/30 text-center group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-brand-gold group-hover:text-white transition-colors duration-500">
                <i
                  className={`fa-solid ${item.icon} text-2xl text-brand-gold group-hover:text-white transition-colors duration-500`}
                ></i>
              </div>
              <h3 className="text-xl font-serif font-bold text-brand-earth mb-4">
                {item.title}
              </h3>
              <p className="text-brand-earth/60 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-brand-earth p-12 md:p-24 rounded-[64px] text-center text-brand-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-bl-[200px] pointer-events-none transition-all duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-mint/5 rounded-tr-[200px] pointer-events-none transition-all duration-1000 group-hover:scale-110"></div>

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-gold leading-tight">
              Join the{" "}
              <span className="italic font-normal text-brand-white/50">
                Linen Revolution
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-brand-white/70 text-base md:text-xl font-light italic">
              "Experience the tactile luxury of pure linen, tailored
              specifically for your unique silhouette."
            </p>
            <div className="pt-8">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={onBeginJourney}
                className="bg-brand-gold text-brand-earth px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-white transition-all shadow-2xl"
              >
                Begin Your Journey
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStory;
