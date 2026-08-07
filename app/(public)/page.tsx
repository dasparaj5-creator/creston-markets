import Hero from "@/components/landing/Hero";
import KeyStats from "@/components/landing/KeyStats";
import TradingInstruments from "@/components/landing/TradingInstruments";
import HowItWorks from "@/components/landing/HowItWorks";
import PlansSection from "@/components/landing/PlansSection";
import Features from "@/components/landing/Features";
import PerformancePlaceholder from "@/components/landing/PerformancePlaceholder";
import ReferralExplainer from "@/components/landing/ReferralExplainer";
import Testimonials from "@/components/landing/Testimonials";
import FaqAccordion from "@/components/landing/FaqAccordion";
import ContactForm from "@/components/landing/ContactForm";
import RiskBanner from "@/components/shared/RiskBanner";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <RiskBanner variant="compact" />
      </div>
      <KeyStats />
      <TradingInstruments />
      <HowItWorks />
      <PlansSection />
      <Features />
      <PerformancePlaceholder />
      <ReferralExplainer />
      <Testimonials />
      <FaqAccordion />
      <ContactForm />
    </>
  );
}
