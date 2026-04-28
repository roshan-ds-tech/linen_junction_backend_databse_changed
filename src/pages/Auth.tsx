import React, { useState } from "react";
import { motion } from "motion/react";
import { User } from "../types";

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ADMIN_EMAIL = "admin@linen.com";
    const ADMIN_PASSWORD = "admin123";

    // 🔐 ADMIN LOGIN CHECK
    if (formData.email === ADMIN_EMAIL) {
      if (formData.password !== ADMIN_PASSWORD) {
        setError("Invalid admin credentials");
        return;
      }
    }

    // Clear error if success
    setError("");

    const isAdmin =
      formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD;

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || (isAdmin ? "Admin" : "User"),
      email: formData.email,
      role: isAdmin ? "admin" : "customer",
    };

    localStorage.setItem("linen_junction_session", JSON.stringify(user));

    onLogin(user);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-brand-white min-h-screen py-12 md:py-24 flex items-center justify-center px-6 md:px-12"
    >
      <motion.div
        variants={itemVariants}
        className="max-w-md w-full bg-white rounded-[40px] md:rounded-[64px] shadow-2xl border border-brand-silver/30 overflow-hidden relative group"
      >
        <div className="absolute top-0 left-0 w-48 h-48 bg-brand-gold/5 rounded-br-[100px] pointer-events-none transition-all duration-700 group-hover:scale-110"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-mint/5 rounded-tl-[100px] pointer-events-none transition-all duration-700 group-hover:scale-110"></div>

        <div className="p-10 md:p-16 relative z-10">
          <motion.div
            variants={itemVariants}
            className="text-center mb-12 space-y-4"
          >
            <h4 className="text-[10.1px] font-bold text-brand-earth/70 uppercase tracking-[0.5em]">
              Artisan Junction
            </h4>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-brand-earth tracking-tight">
              {isLogin ? "Welcome Back" : "Join Registry"}
            </h1>
            <div className="w-12 h-1 bg-brand-gold mx-auto rounded-full"></div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <motion.div variants={itemVariants} className="space-y-2">
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
                  placeholder="Artisan Client"
                />
              </motion.div>
            )}
            <motion.div variants={itemVariants} className="space-y-2">
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
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[11px] font-bold text-brand-earth/60 uppercase tracking-widest ml-1">
                Security Token
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-white border border-brand-silver/30 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all shadow-sm placeholder:text-brand-earth/20 font-mono"
                placeholder="••••••••"
              />
            </motion.div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <motion.div variants={itemVariants} className="pt-6">
              <button
                type="submit"
                className="w-full bg-brand-earth text-brand-gold font-bold tracking-[0.3em] py-5 rounded-2xl shadow-xl hover:-translate-y-1 transition-all uppercase text-xs md:text-sm group"
              >
                {isLogin ? "AUTHORIZE ACCESS" : "CREATE REGISTRY ENTRY"}
              </button>
            </motion.div>
          </form>

          <motion.div
            variants={itemVariants}
            className="mt-12 text-center space-y-6"
          >
            {/* <div className="flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-brand-silver/30"></div>
              <span className="text-[10px] font-bold text-brand-earth/30 uppercase tracking-widest">
                Or Continue With
              </span>
              <div className="h-px w-8 bg-brand-silver/30"></div>
            </div>
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full border border-brand-silver/30 flex items-center justify-center text-brand-earth hover:bg-brand-earth hover:text-brand-gold transition-all"
              >
                <i className="fa-brands fa-google text-lg"></i>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full border border-brand-silver/30 flex items-center justify-center text-brand-earth hover:bg-brand-earth hover:text-brand-gold transition-all"
              >
                <i className="fa-brands fa-apple text-lg"></i>
              </motion.button>
            </div> */}
            <p className="text-[11px] text-brand-earth/50 font-medium">
              {isLogin
                ? "Don't have a registry entry?"
                : "Already have a registry entry?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-brand-earth/80 text-[11.11px] font-bold hover:text-brand-earth transition-colors uppercase tracking-widest"
              >
                {isLogin ? "Join Registry" : "Authorize Access"}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Auth;
