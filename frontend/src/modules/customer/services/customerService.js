import {
  fetchCurrentUser,
  fetchUserBookings,
  bookClassSession,
  cancelClassBooking,
  fetchUserPayments,
  fetchUserWorkouts,
  fetchUserDiets,
  fetchUserProgress,
  fetchUserAssessments,
  requestMembershipAction,
  updateUserProfile,
  createPaymentOrder,
  verifyPaymentOrder,
} from '../../../services/api';

export const customerService = {
  getCurrentProfile: fetchCurrentUser,
  getBookings: fetchUserBookings,
  bookClass: bookClassSession,
  cancelBooking: cancelClassBooking,
  getPayments: fetchUserPayments,
  getWorkouts: fetchUserWorkouts,
  getDiets: fetchUserDiets,
  getProgress: fetchUserProgress,
  getAssessments: fetchUserAssessments,
  requestMembershipAction,
  updateProfile: updateUserProfile,
  createPaymentOrder,
  verifyPaymentOrder,
};

export default customerService;
