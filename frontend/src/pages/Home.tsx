import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { StatsStrip } from '../components/home/StatsStrip';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { JobDiscoverySection } from '../components/home/JobDiscoverySection';
import { JobMarketSection } from '../components/home/JobMarketSection';
import { JobseekerBenefitsSection } from '../components/home/JobseekerBenefitsSection';
import { EmployerSection } from '../components/home/EmployerSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { CompaniesHiringSection } from '../components/home/CompaniesHiringSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { FaqSection } from '../components/home/FaqSection';
import { CtaBannerSection } from '../components/home/CtaBannerSection';
import { Footer } from '../components/Footer';

export const Home: React.FC = () => {
  return (
    <div className="home-page" role="main">
      <HeroSection />
      <StatsStrip />
      <CategoriesSection />
      <JobDiscoverySection />
      <JobMarketSection />
      <JobseekerBenefitsSection />
      <EmployerSection />
      <HowItWorksSection />
      <CompaniesHiringSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaBannerSection />
      <Footer />
    </div>
  );
};

export default Home;
