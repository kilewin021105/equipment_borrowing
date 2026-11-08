const API_BASE = '/api';

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

