import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../api/authService';
import { storage } from '../utils/crypto';
import AlertModal from '../components/ui/AlertModal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTamperModal, setShowTamperModal] = useState(false);

  const handleTamper = useCallback(() => {
    authService.logout();
    setUser(null);
    setShowTamperModal(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkIntegrity = () => {
      const savedUser = authService.getUser();
      const token = authService.getToken();
      const rutas = storage.get('rutas');

      // Si hay datos pero alguno está corrupto (TAMPERED)
      if (savedUser === 'TAMPERED' || token === 'TAMPERED' || rutas === 'TAMPERED') {
        handleTamper();
        return;
      }

      if (savedUser && token) {
        setUser(savedUser);
      }
      setLoading(false);
    };

    checkIntegrity();

    // Escuchar cambios en localStorage desde otras pestañas
    window.addEventListener('storage', (e) => {
      if (['user', 'token', 'rutas'].includes(e.key)) {
        checkIntegrity();
      }
    });

    return () => window.removeEventListener('storage', () => {});
  }, [handleTamper]);

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password);
    storage.set('token', data.token);
    storage.set('user', data.user);
    if (data.user.rutas) {
      storage.set('rutas', data.user.rutas);
    }
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (registerData) => {
    const data = await authService.register(registerData);
    storage.set('token', data.token);
    storage.set('user', data.user);
    if (data.user.rutas) {
      storage.set('rutas', data.user.rutas);
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    logout,
    loading
  }), [user, login, register, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AlertModal 
        isOpen={showTamperModal} 
        message="Se ha detectado una alteración inesperada en los datos de la sesión. Por seguridad, se ha cerrado la sesión." 
        onClose={() => setShowTamperModal(false)}
      />
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
