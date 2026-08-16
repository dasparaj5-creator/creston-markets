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
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: whatsappSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "whatsapp_number")
    .maybeSingle();

  return (
    <>
      <Hero />
      <KeyStats />
      <TradingInstruments />
      <HowItWorks />
      <PlansSection />
      <Features />
      <PerformancePlaceholder />
      <ReferralExplainer />
      <Testimonials />
      <FaqAccordion />
      <ContactForm whatsappNumber={whatsappSetting?.value ?? ""} />
    </>
  );
}
