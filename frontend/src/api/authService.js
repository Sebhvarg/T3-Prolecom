const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const authService = {
  login: async (user, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ERROR_LOGIN');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => localStorage.getItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user')),
};
