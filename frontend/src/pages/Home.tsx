import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { CompaniesHiringSection } from '../components/home/CompaniesHiringSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { WorkSimIntroSection } from '../components/home/WorkSimIntroSection';
import { FaqSection } from '../components/home/FaqSection';
import { Footer } from '../components/Footer';
import { PageTransition } from '../components/common/PageTransition';

export const Home: React.FC = () => {
  return (
    <PageTransition>
      <div className="home-page" role="main">
        {/* 1 & 2. Hero Section with Search and Real Jobs Preview / Illustrative Fallback */}
        <HeroSection />

        {/* 3. Browse Jobs by Category with Real Published Counts */}
        <CategoriesSection />

        {/* 4. Companies Hiring Now with Real Approved Companies and Openings */}
        <CompaniesHiringSection />

        {/* 5. Concise How It Works with Interactive Animated Steps */}
        <HowItWorksSection />

        {/* 6. WorkSim Feature Spotlight */}
        <WorkSimIntroSection />

        {/* 7. Balanced Two-Column Animated FAQ Section */}
        <FaqSection />

        {/* 8. Complete Footer with Working Links */}
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Home;
