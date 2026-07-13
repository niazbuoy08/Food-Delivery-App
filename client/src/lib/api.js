import axios from 'axios';

// Render's free tier spins the server down after ~15 minutes idle, and the
// request that wakes it can hang for 50s+ before the app answers. A shorter
// timeout aborts mid-wake, so the first navigation after an idle period fails
// while a manual reload (by which time the server is up) succeeds. Give the
// cold start room to finish.
const COLD_START_ALLOWANCE_MS = 75000;

const api = axios.create({ baseURL: '/api', timeout: COLD_START_ALLOWANCE_MS });

const TOKEN_KEY = 'tt_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Attach the admin token to every request. Customer endpoints ignore it.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // An expired or revoked token means the admin session is over. Clear it and
    // bounce to login — but only from admin pages, so a customer never gets
    // redirected out of checkout.
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      tokenStore.clear();
      if (!window.location.pathname.endsWith('/login')) {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(error);
  }
);

const isDev = import.meta.env.DEV;

/** Pulls the server's message out of an axios error, with sane fallbacks. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.code === 'ECONNABORTED') {
    return 'The kitchen took too long to answer. Please try again.';
  }
  if (!error.response) {
    // The dev-only hint would be nonsense to a real visitor on the public site.
    return isDev
      ? 'Cannot reach the server. Is the API running on port 5000?'
      : 'We could not reach the kitchen. Check your connection and try again.';
  }
  return error.response.data?.message || fallback;
}

export default api;
