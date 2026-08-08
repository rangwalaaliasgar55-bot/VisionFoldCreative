import WorkSection from "../components/WorkSection";
import CTASection from "../components/CTASection";

export default function WorkPage() {
  return (
    <main className="pt-24">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <h1 className="font-display font-bold text-4xl md:text-6xl mb-4">Our Work</h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto">A selection of projects that define our craft.</p>
      </div>
      <WorkSection />
      <CTASection />
    </main>
  );
}
