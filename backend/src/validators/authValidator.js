/**
 * Validation utilities for auth, registration, and user input
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const validatePhone = (phone) => {
  return typeof phone === 'string' && phone.trim().length >= 8;
};

const validateTrainerApplication = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!data.email || !validateEmail(data.email)) errors.push('A valid email address is required');
  if (!data.phone || !validatePhone(data.phone)) errors.push('A valid phone number is required');
  if (data.yearsOfExperience === undefined || Number(data.yearsOfExperience) < 0) {
    errors.push('Valid years of experience is required');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateTrainerApplication,
};
