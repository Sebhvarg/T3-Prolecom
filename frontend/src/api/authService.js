import { storage } from '../utils/crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const authService = {
  login: async (user, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
      'Accept': 'application/json',
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

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

    let data;
    try {
      data = await response.json();
      if (data && data.protected) {
        data = storage.decryptPayload(data.payload);
      }
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`, { cause: e });
      }
    }

    if (!response.ok) {
      let errorMsg = 'Ocurrió un error inesperado';
      if (data) {
        if (data.errors) {
          const firstKey = Object.keys(data.errors)[0];
          const messages = data.errors[firstKey];
          errorMsg = Array.isArray(messages) ? messages[0] : messages;
        } else {
          errorMsg = data.message || data.error || errorMsg;
        }
      }
      throw new Error(errorMsg);
    }
    
    return data;
  }
};

