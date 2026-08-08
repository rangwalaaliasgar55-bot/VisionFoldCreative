import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import CTASection from "../components/CTASection";

const plans = [
  { name: "Starter", price: "2,500", features: ["Up to 3 min edit", "1 revision round", "Color correction", "Basic sound mix", "5-day delivery"] },
  { name: "Professional", price: "5,000", features: ["Up to 10 min edit", "3 revision rounds", "Full color grade", "Sound design", "Motion graphics", "10-day delivery"], popular: true },
  { name: "Enterprise", price: "Custom", features: ["Unlimited length", "Unlimited revisions", "HDR grading", "VFX package", "Dedicated editor", "Priority delivery"] },
];

export default function PricingPage() {
  return (
    <main className="pt-24">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <h1 className="font-display font-bold text-4xl md:text-6xl mb-4">Transparent Pricing</h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto">Choose a package that fits your project. Custom quotes available.</p>
      </div>
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-6 mb-20">
        {plans.map((plan) => (
          <div key={plan.name} className={`glass rounded-2xl p-8 border ${plan.popular ? "border-accent/50 shadow-lg shadow-accent/10" : "border-white/5"}`}>
            {plan.popular && <span className="text-xs font-semibold text-accent uppercase tracking-wider">Most Popular</span>}
            <h3 className="font-display font-bold text-2xl mt-2 mb-1">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold">{plan.price === "Custom" ? "" : "$"}{plan.price}</span>
              {plan.price !== "Custom" && <span className="text-white/40 text-sm"> / project</span>}
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-emerald shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link to="/contact" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
              plan.popular ? "bg-accent text-white hover:shadow-lg hover:shadow-accent/30" : "glass hover:bg-white/10"
            }`}>Get Started</Link>
          </div>
        ))}
      </div>
      <CTASection />
    </main>
  );
}
