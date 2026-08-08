import { Link } from "react-router-dom";
import { Film, Heart, ArrowUpRight, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";

const footerLinks = {
  Studio: ["/work", "/services", "/pricing", "/contact"],
  Company: ["/about", "/portal", "/admin"],
  Legal: ["/privacy", "/terms"],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-accent" />
              <span className="font-display font-bold text-xl">
                Vision<span className="text-accent">Fold</span>
              </span>
            </Link>
            <p className="text-white/40 max-w-sm leading-relaxed">
              Premium video editing studio crafting cinematic stories for brands, artists, and creators worldwide.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/60">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link to={link} className="text-white/40 hover:text-white transition-colors text-sm flex items-center gap-1 group">
                      {link.replace("/", "") || "Home"}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-sm text-white/30">© 2026 VisionFold Creative. All rights reserved.</p>
          <div className="flex gap-3">
            {[Instagram, Twitter, Youtube, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors">
                <Icon className="w-4 h-4 text-white/50" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
