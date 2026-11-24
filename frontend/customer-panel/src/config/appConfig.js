/**
 * Global Application Configuration
 */
export const APP_CONFIG = {
  APP_NAME: 'QNOX GYM',
  TAGLINE: 'Elevating Human Performance & Architectural Solitude',
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  DEFAULT_CURRENCY: 'INR',
  DEFAULT_LOCALE: 'en-IN',
  STORAGE_KEYS: {
    AUTH_TOKEN: 'qnox_auth_token',
    USER: 'qnox_user',
    VIEW_MODE: 'qnox_view_mode',
  },
  ROLES: {
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
    TRAINER: 'Trainer',
    MEMBER: 'Member',
  },
};

export default APP_CONFIG;
