import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { JobDiscoverySection } from '../components/home/JobDiscoverySection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { WorkSimSpotlightSection } from '../components/home/WorkSimSpotlightSection';
import { AudiencePillarsSection } from '../components/home/AudiencePillarsSection';
import { TrustPrinciplesSection } from '../components/home/TrustPrinciplesSection';
import { FaqSection } from '../components/home/FaqSection';
import { CtaBannerSection } from '../components/home/CtaBannerSection';
import { Footer } from '../components/Footer';

export const Home: React.FC = () => {
  return (
    <div className="home-page" role="main">
      <HeroSection />
      <JobDiscoverySection />
      <HowItWorksSection />
      <WorkSimSpotlightSection />
      <AudiencePillarsSection />
      <TrustPrinciplesSection />
      <FaqSection />
      <CtaBannerSection />
      <Footer />
    </div>
  );
};

export default Home;
