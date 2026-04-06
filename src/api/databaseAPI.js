// API configuration and utility functions for database operations

// allow overriding via Vite env (VITE_API_BASE), otherwise fall back to same-origin `/api`
const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';

// ==================== LOGIN HISTORY FUNCTIONS ====================

export const loginHistory = {
  // Record user login
  recordLogin: async (userId, ipAddress, userAgent, deviceType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login-history/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error recording login:', error);
      throw error;
    }
  },

  // Record user logout
  recordLogout: async (loginId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login-history/logout/${loginId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error('Error recording logout:', error);
      throw error;
    }
  },

  // Get login history for a user
  getHistory: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login-history/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  }
};

// ==================== SAVED ITEMS FUNCTIONS ====================

export const savedItems = {
  // Add item to saved list
  add: async (userId, itemId, itemName, itemType, itemDescription, itemImage) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-items/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          item_id: itemId,
          item_name: itemName,
          item_type: itemType,
          item_description: itemDescription,
          item_image: itemImage
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  },

  // Remove item from saved list
  remove: async (savedItemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-items/${savedItemId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('Error removing saved item:', error);
      throw error;
    }
  },

  // Get all saved items for user
  getAll: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-items/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching saved items:', error);
      throw error;
    }
  },

  // Check if item is saved
  check: async (userId, itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-items/check/${userId}/${itemId}`);
      return await response.json();
    } catch (error) {
      console.error('Error checking saved item:', error);
      throw error;
    }
  }
};

// ==================== WISHLIST FUNCTIONS ====================

export const wishlist = {
  // Add item to wishlist
  add: async (userId, itemId, itemName, itemType, itemDescription, itemImage, priority = 'medium') => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          item_id: itemId,
          item_name: itemName,
          item_type: itemType,
          item_description: itemDescription,
          item_image: itemImage,
          priority: priority
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  // Remove item from wishlist
  remove: async (wishlistId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${wishlistId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },

  // Get all wishlist items for user
  getAll: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  },

  // Update wishlist item priority
  updatePriority: async (wishlistId, priority) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating wishlist priority:', error);
      throw error;
    }
  },

  // Check if item is in wishlist
  check: async (userId, itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/check/${userId}/${itemId}`);
      return await response.json();
    } catch (error) {
      console.error('Error checking wishlist:', error);
      throw error;
    }
  }
};

// ==================== TOPICS FUNCTIONS ====================

export const topics = {
  // List all topics
  list: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/topics`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  },

  // Create a new topic (admin)
  create: async (title, description, instructor, level) => {
    try {
      const url = `${API_BASE_URL}/topics`;
      console.log('topics.create -> POST', url, { title, description, instructor, level });
      const token = localStorage.getItem('authToken');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title, description, instructor, level })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.message || `status ${response.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('Error creating topic:', error);
      // network error? try health check for more info
      if (error && error.message && error.message.toLowerCase().includes('failed to fetch')) {
        try {
          await fetch(`${API_BASE_URL}/health`);
        } catch (h) {
          console.error('Health check also failed', h);
          throw new Error('Network error: cannot reach backend server');
        }
      }
      throw error;
    }
  },

  // simple endpoint for frontend connectivity tests
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  },

  // Update an existing topic (admin)
  update: async (id, title, description, instructor, level) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/topics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title, description, instructor, level })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.message || `status ${response.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  },

  // Delete a topic (admin)
  remove: async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/topics/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }
};

// ==================== USER FUNCTIONS ====================

export const pdfs = {
  // Get list of PDFs (optionally provide token for auth)
  // you can also pass query parameters, e.g. { topicId: 5 }
  list: async (token, params = {}) => {
    try {
      let url = `${API_BASE_URL}/pdfs`;
      const query = new URLSearchParams();
      for (const key of Object.keys(params)) {
        if (params[key] != null) query.append(key, params[key]);
      }
      if (query.toString()) url += `?${query}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(url, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error fetching pdfs:', error);
      throw error;
    }
  },

  // Upload a PDF file (authenticated user)
  upload: async (file, topicId = null) => {
    try {
      const token = localStorage.getItem('authToken');
      const form = new FormData();
      form.append('file', file);
      let url = `${API_BASE_URL}/pdfs/upload`;
      if (topicId) url += `?topicId=${topicId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('Error uploading pdf:', error);
      throw error;
    }
  },

  // optionally delete a PDF by id (admin users)
  remove: async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/pdfs/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting pdf:', error);
      throw error;
    }
  }
};

export const auth = {
  // login returns { ok, token, user }
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (!response.ok) {
        let msg = data?.message;
        if (!msg) {
          // Vite proxy often returns 5xx with no JSON when Spring Boot is not running on :5000
          if (response.status >= 500) {
            msg =
              'Cannot reach the API (often the backend is not running). Start Spring Boot on port 5000, then sign in again.';
          } else if (response.status === 502 || response.status === 503 || response.status === 504) {
            msg =
              'Bad gateway — the dev server could not reach the backend. Start the backend on port 5000.';
          } else {
            msg = `status ${response.status}`;
          }
        }
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('Error during auth.login:', error);
      throw error;
    }
  }
};

export const users = {
  // Get user details
  getDetails: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // create a user (admin or bootstrap); returns {ok,userId}
  create: async (username, email, password, role) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.message || `status ${response.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('Error creating user via API:', error);
      throw error;
    }
  },
  list: async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('Error fetching user list:', error);
      throw error;
    }
  },
  me: async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // login history
  loginHistory: {
    list: async (userId) => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/login-history/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || `status ${response.status}`);
        }
        return data;
      } catch (error) {
        console.error('Error fetching login history:', error);
        throw error;
      }
    }
  },
  enrollments: {
    add: async (userId, topicId) => {
      const response = await fetch(`${API_BASE_URL}/enrollments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, topic_id: topicId })
      });
      return await response.json();
    },
    remove: async (userId, topicId) => {
      const response = await fetch(`${API_BASE_URL}/enrollments/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, topic_id: topicId })
      });
      return await response.json();
    },
    listByUser: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/enrollments/user/${userId}`);
      return await response.json();
    }
  },
  reports: {
    summary: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reports/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `status ${response.status}`);
      return data;
    }
  },

  // update user fields (admin)
  update: async (userId, updates) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // delete user (admin)
  remove: async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || `status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};

// convenient named exports for nested groups used in the UI
export const reports = users.reports;
export const enrollments = users.enrollments;

export default {
  loginHistory,
  savedItems,
  wishlist,
  topics,
  pdfs,
  auth,
  users,
  reports,
  enrollments
};
