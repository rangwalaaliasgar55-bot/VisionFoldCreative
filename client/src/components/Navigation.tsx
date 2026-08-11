import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, User } from "lucide-react";
import { useStore } from "../store/useStore";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Work", href: "/work" },
  { name: "Services", href: "/services" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useStore();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-strong py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/brand/visionfold-mark.svg"
              alt=""
              className="w-9 h-9 object-contain opacity-95 group-hover:opacity-100 transition-opacity text-white"
            />
            <span className="font-display font-bold text-xl tracking-tight">
              Vision<span className="text-amber">Fold</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg group ${
                  location.pathname === link.href ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {location.pathname === link.href && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm text-white/60 hover:text-white transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/portal" className="text-sm text-white/60 hover:text-white transition-colors">
                  Portal
                </Link>
                <button
                  onClick={logout}
                  className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/contact"
                  className="group relative px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-accent/30"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Start Project
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-coral opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white/80 hover:text-white">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-void/95 backdrop-blur-2xl pt-24 px-6"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div key={link.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link to={link.href} className="block py-4 text-2xl font-display font-semibold text-white/80 hover:text-white border-b border-white/5">
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6">
                <Link to="/contact" className="block w-full py-4 bg-accent text-white text-center font-semibold rounded-xl">
                  Start Your Project
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
