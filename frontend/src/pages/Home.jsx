import React from 'react';
import Hero from '../components/Hero';
import ExperienceVideoSection from '../components/ExperienceVideoSection';
import DisciplinesSection from '../components/DisciplinesSection';
import ClubsSection from '../components/ClubsSection';
import MembershipTiers from '../components/MembershipTiers';
import ScheduleSection from '../components/ScheduleSection';
import MasterTrainers from '../components/MasterTrainers';
import EditorialQuotes from '../components/EditorialQuotes';

export default function Home({
  onOpenTourModal,
  onSelectPlanForCheckout,
  onOpenAuth,
  onShowToast,
  clubs = [],
  classes = [],
  plans = [],
  currentUser = null,
}) {
  return (
    <>
      {/* Cinematic Hero */}
      <Hero onOpenTourModal={onOpenTourModal} />

      {/* The Red Room Workout Experience Video Showcase */}
      <ExperienceVideoSection onOpenTourModal={onOpenTourModal} />

      {/* London Clubs Directory */}
      <ClubsSection clubs={clubs} onOpenTourModal={onOpenTourModal} />

      {/* Curated Disciplines & Sanctuaries */}
      <DisciplinesSection onOpenTourModal={onOpenTourModal} />

      {/* Membership Tiers & Razorpay Checkout */}
      <MembershipTiers
        plans={plans}
        onOpenTourModal={onOpenTourModal}
        onSelectPlanForCheckout={onSelectPlanForCheckout}
      />

      {/* Live Daily Schedule */}
      <ScheduleSection
        classes={classes}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onShowToast={onShowToast}
      />

      {/* Master Trainers & Coaches */}
      <MasterTrainers onOpenTourModal={onOpenTourModal} />

      {/* Press Quotes & Brand Ticker */}
      <EditorialQuotes />
    </>
  );
}
