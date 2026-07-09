import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

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

/** Pulls the server's message out of an axios error, with sane fallbacks. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (!error.response) return 'Cannot reach the server. Is the API running on port 5000?';
  return error.response.data?.message || fallback;
}

export default api;
