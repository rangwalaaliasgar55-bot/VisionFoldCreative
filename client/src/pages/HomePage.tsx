import HeroSection from "../components/HeroSection";
import StorySection from "../components/StorySection";
import ShowcaseVideo from "../components/ShowcaseVideo";
import ClientsGlobe from "../components/ClientsGlobe";
import ServicesSection from "../components/ServicesSection";
import WorkSection from "../components/WorkSection";
import ProcessSection from "../components/ProcessSection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/CTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StorySection />
      <div id="showreel">
        <ShowcaseVideo />
      </div>
      <ClientsGlobe />
      <ServicesSection />
      <WorkSection />
      <ProcessSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
