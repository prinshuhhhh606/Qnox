import {
  fetchClubs,
  fetchSchedule,
  fetchMembershipPlans,
  createTourInquiry,
  subscribeNewsletter,
  verifyNewsletter,
  fetchTrainers,
} from './api';

export const commonService = {
  getClubs: fetchClubs,
  getSchedule: fetchSchedule,
  getMembershipPlans: fetchMembershipPlans,
  bookTour: createTourInquiry,
  subscribeNewsletter,
  verifyNewsletter,
  getTrainers: fetchTrainers,
};

export default commonService;
