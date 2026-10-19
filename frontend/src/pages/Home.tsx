import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturedJobsSection } from '../components/home/FeaturedJobsSection';
import { WhyJoinSection } from '../components/home/WhyJoinSection';
import { EmployerSuiteShowcase } from '../components/home/EmployerSuiteShowcase';
import { CandidateJourneyShowcase } from '../components/home/CandidateJourneyShowcase';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { FinalCtaSection } from '../components/home/FinalCtaSection';
import { Footer } from '../components/Footer';
import { PageTransition } from '../components/common/PageTransition';

export const Home: React.FC = () => {
  return (
    <PageTransition>
      <div className="home-page" role="main">
        {/* 1. Hero Section with Value Proposition, 10K+ stats, and Explore Opportunities Search */}
        <HeroSection />

        {/* 2. Featured Jobs Grid from Live Marketplace API */}
        <FeaturedJobsSection />

        {/* 3. Why Join HireSphere Credibility Pillars & Testimonial */}
        <WhyJoinSection />

        {/* 4. Employer Workspace Showcase with Pipeline Funnel */}
        <EmployerSuiteShowcase />

        {/* 5. Candidate Skills Certification & Career Progression */}
        <CandidateJourneyShowcase />

        {/* 6. How HireSphere Works with Interactive Dual-Track Progression */}
        <HowItWorksSection />

        {/* 7. Final Call to Action with Dual Pathways */}
        <FinalCtaSection />

        {/* 8. Comprehensive Platform Footer */}
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Home;
