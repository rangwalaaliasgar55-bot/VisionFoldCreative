import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServicesSection";
import WorkSection from "../components/WorkSection";
import ProcessSection from "../components/ProcessSection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/CTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <WorkSection />
      <ProcessSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
