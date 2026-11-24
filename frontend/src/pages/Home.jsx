import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../components/Hero';
import ExperienceVideoSection from '../components/ExperienceVideoSection';
import DisciplinesSection from '../components/DisciplinesSection';
import ClubsSection from '../components/ClubsSection';
import MembershipTiers from '../components/MembershipTiers';
import ScheduleSection from '../components/ScheduleSection';
import MasterTrainers from '../components/MasterTrainers';
import EditorialQuotes from '../components/EditorialQuotes';
import { fetchClubs, fetchSchedule, fetchMembershipPlans } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

export default function Home(props) {
  const outletCtx = useOutletContext() || {};
  const { currentUser: authUser } = useAuth();
  const { showToast: notifToast } = useNotifications();

  const onOpenTourModal = props.onOpenTourModal || outletCtx.onOpenTourModal;
  const onSelectPlanForCheckout = props.onSelectPlanForCheckout || outletCtx.onSelectPlanForCheckout;
  const onOpenAuth = props.onOpenAuth || outletCtx.onOpenAuth;
  const onShowToast = props.onShowToast || notifToast;
  const currentUser = props.currentUser || authUser;

  const [clubs, setClubs] = useState(props.clubs || []);
  const [classes, setClasses] = useState(props.classes || []);
  const [plans, setPlans] = useState(props.plans || []);

  useEffect(() => {
    if (!props.clubs || props.clubs.length === 0) {
      fetchClubs().then((res) => res && setClubs(res));
    }
    if (!props.classes || props.classes.length === 0) {
      fetchSchedule().then((res) => res && setClasses(res));
    }
    if (!props.plans || props.plans.length === 0) {
      fetchMembershipPlans().then((res) => res && setPlans(res));
    }
  }, [props.clubs, props.classes, props.plans]);

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
