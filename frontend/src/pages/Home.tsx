import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { StatsStrip } from '../components/home/StatsStrip';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { EmployerSection } from '../components/home/EmployerSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { CompaniesHiringSection } from '../components/home/CompaniesHiringSection';
import { WorkSimIntroSection } from '../components/home/WorkSimIntroSection';
import { FaqSection } from '../components/home/FaqSection';
import { Footer } from '../components/Footer';
import { PageTransition } from '../components/common/PageTransition';

export const Home: React.FC = () => {
  return (
    <PageTransition>
      <div className="home-page" role="main">
        {/* 1. Hero Section with Exact Boxes (Pic 1) */}
        <HeroSection />

        {/* 2. Stats Strip with Incremental Counts (Pic 2) */}
        <StatsStrip />

        {/* 3. Browse Jobs by Category with Real Published Counts */}
        <CategoriesSection />

        {/* 4. For Employers Section (Pic 3 with Suite Showcase) */}
        <EmployerSection />

        {/* 5. How It Works with 3 Interactive Stages & Opening Animation */}
        <HowItWorksSection />

        {/* 6. Companies Hiring Now */}
        <CompaniesHiringSection />

        {/* 7. WorkSim Practical Challenges Feature Spotlight */}
        <WorkSimIntroSection />

        {/* 8. Help & FAQ Section */}
        <FaqSection />

        {/* 9. Complete Footer with Verified Platform Links */}
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Home;
