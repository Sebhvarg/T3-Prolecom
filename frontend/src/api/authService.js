import { storage } from '../utils/crypto';

const API_URL = import.meta.env.VITE_API_URL || 'https://127.0.0.1:8000/api';

function parseErrorMessage(data) {
  if (!data) return 'Ocurrió un error inesperado';
  if (data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    const messages = data.errors[firstKey];
    return Array.isArray(messages) ? messages[0] : messages;
  }
  return data.message || data.error || 'Ocurrió un error inesperado';
}

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

    // Solo descifrar si la respuesta fue exitosa Y está protegida
    // Las respuestas de error NO están cifradas — descifrarlas resulta en null
    if (response.ok && data?.protected) {
      data = storage.decryptPayload(data.payload);
    }

    if (!response.ok || !data) {
      // Caso especial: demasiados intentos (HTTP 429)
      // El backend devuelve: { error: "...", retry_after: N }
      if (response.status === 429) {
        const err = new Error(data?.error || 'Demasiados intentos fallidos.');
        err.retry_after = data?.retry_after ?? 30;
        throw err;
      }
      const message = data?.error || data?.message || 'ERROR_LOGIN';
      throw new Error(message);
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
      globalThis.dispatchEvent(new Event('storage')); // Esto disparará el checkIntegrity en AuthContext
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
      globalThis.location.href = '/login';
      throw new Error('SESSION_EXPIRED');
    }

    let data;
    try {
      data = await response.json();
      if (data?.protected) {
        data = storage.decryptPayload(data.payload);
      }
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`, { cause: e });
      }
    }

    if (!response.ok) {
      throw new Error(parseErrorMessage(data));
    }
    
    return data;
  }
};

export const ROLE_REDIRECTS = {
  'Administrador': '/admin',
  'Moderador': '/moderador/dashboard',
  'Profesor': '/profesor/dashboard',
  'Ayudante': '/ayudante/dashboard',
  'Estudiante': '/dashboard/estudiante'
};

