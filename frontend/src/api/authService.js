import { storage } from '../utils/crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const authService = {
  login: async (user, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: user, password }),
      });

      let data = await response.json();

      // Si la respuesta está protegida, la desciframos
      if (data && data.protected) {
        data = storage.decryptPayload(data.payload);
      }

      if (!response.ok || !data) {
        throw new Error(data?.error || 'ERROR_LOGIN');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    storage.remove('token');
    storage.remove('user');
    storage.remove('rutas');
  },

  getToken: () => storage.get('token'),
  getUser: () => storage.get('user'),
  getRutas: () => {
    const rutas = storage.get('rutas');
    return rutas === 'TAMPERED' ? [] : (rutas || []);
  },

  // Helper para llamadas protegidas con el Token
  apiFetch: async (endpoint, options = {}) => {
    const token = storage.get('token');
    
    if (token === 'TAMPERED') {
      // Si el token fue alterado, forzamos cierre de sesión
      window.dispatchEvent(new Event('storage')); // Esto disparará el checkIntegrity en AuthContext
      throw new Error('SESSION_TAMPERED');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      authService.logout();
      window.location.href = '/login';
      throw new Error('SESSION_EXPIRED');
    }

    let data = await response.json();
    if (data && data.protected) {
      data = storage.decryptPayload(data.payload);
    }
    
    return data;
  }
};

