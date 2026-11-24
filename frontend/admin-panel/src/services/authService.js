import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  getStoredUser,
  getStoredToken,
  setStoredToken,
  forgotPassword,
  resetPassword,
} from './api';

export const authService = {
  login: loginUser,
  register: registerUser,
  logout: logoutUser,
  getCurrentUser: fetchCurrentUser,
  getStoredUser,
  getStoredToken,
  setStoredToken,
  forgotPassword,
  resetPassword,
};

export default authService;
