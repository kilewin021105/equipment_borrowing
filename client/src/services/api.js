// For a separately hosted frontend, VITE_API_URL points to the Render backend.
// When frontend and API share one Render domain (or in local dev), it falls back to relative '/api'.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('campusequip_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    // If unauthorized, clear token and notify
    if (token) {
      localStorage.removeItem('campusequip_token');
      localStorage.removeItem('campusequip_user');
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  adminLogin: async (credentials) => {
    try {
      return await request('/auth/admin-login', { method: 'POST', body: credentials });
    } catch (err) {
      // Fallback to standard login if /admin-login returns 404
      if (err.status === 404) {
        const res = await request('/auth/login', { method: 'POST', body: credentials });
        if (res.user && res.user.role !== 'admin') {
          throw new Error('Access Denied: This account is not a System Administrator.');
        }
        return res;
      }
      throw err;
    }
  },
  getAdminStatus: async () => {
    try {
      return await request('/auth/admin-status');
    } catch {
      try {
        const limits = await request('/auth/role-limits');
        const count = limits.data?.admin?.current || 0;
        return { success: true, hasAdmin: count > 0, adminCount: count, maxAdmins: 5 };
      } catch {
        return { success: true, hasAdmin: false, adminCount: 0, maxAdmins: 5 };
      }
    }
  },
  setupInitialAdmin: async (data) => {
    try {
      return await request('/auth/admin-setup', { method: 'POST', body: data });
    } catch (err) {
      if (err.status === 404) {
        return await request('/auth/register', { method: 'POST', body: { ...data, role: 'admin' } });
      }
      throw err;
    }
  },
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getRoleLimits: () => request('/auth/role-limits'),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: profileData }),

  // Equipment
  getEquipment: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/equipment${query ? `?${query}` : ''}`);
  },
  getEquipmentById: (id) => request(`/equipment/${id}`),
  createEquipment: (data) => request('/equipment', { method: 'POST', body: data }),
  updateEquipment: (id, data) => request(`/equipment/${id}`, { method: 'PUT', body: data }),
  deleteEquipment: (id) => request(`/equipment/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Borrow
  getBorrowRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/borrow${query ? `?${query}` : ''}`);
  },
  getBorrowRequestById: (id) => request(`/borrow/${id}`),
  createBorrowRequest: (data) => request('/borrow', { method: 'POST', body: data }),
  updateRequestStatus: (id, data) => request(`/borrow/${id}/status`, { method: 'PATCH', body: data }),
  cancelBorrowRequest: (id) => request(`/borrow/${id}/cancel`, { method: 'PATCH' }),

  // Stats
  getSummaryStats: () => request('/stats/summary'),
  getAnalytics: () => request('/stats/analytics'),

  // Users (Admin)
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id = 'all') => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  clearNotifications: () => request('/notifications', { method: 'DELETE' }),

  // Audit
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  }
};

