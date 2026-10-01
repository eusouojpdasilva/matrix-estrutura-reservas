import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import DestinationsStrip from "@/components/DestinationsStrip";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DestinationsGrid from "@/components/DestinationsGrid";
import ForWhoSection from "@/components/ForWhoSection";
import AboutSection from "@/components/AboutSection";
import BlogSection from "@/components/BlogSection";
import FAQSection from "@/components/FAQSection";
import StepForm from "@/components/StepForm";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinalCTA from "@/components/FinalCTA";
import FooterCTA from "@/components/FooterCTA";

const Index = () => {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <DestinationsStrip />
        <ProblemSection />
        <HowItWorksSection />
        <DestinationsGrid />
        <ForWhoSection />
        <AboutSection />
        <BlogSection />
        <FAQSection />
        <StepForm />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <FooterCTA />
    </>
  );
};

export default Index;
