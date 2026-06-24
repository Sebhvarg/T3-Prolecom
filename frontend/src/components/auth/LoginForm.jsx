import { useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [countdown, setCountdown] = useState(0); // segundos restantes de bloqueo
  const countdownRef = useRef(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Limpia el intervalo al desmontar el componente
  useEffect(() => {
    return () => clearInterval(countdownRef.current);
  }, []);

  const startCountdown = (seconds) => {
    setCountdown(seconds);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isBlocked = countdown > 0;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isBlocked) return;
    setError('');
    setLoading(true);

    try {
      const userData = await login(user, password);
      
      const roleRedirects = {
        'Administrador': '/admin',
        'Moderador': '/moderador/dashboard',
        'Profesor': '/profesor/dashboard',
        'Ayudante': '/ayudante/dashboard',
        'Estudiante': '/dashboard/estudiante',
      };

      const targetPath = roleRedirects[userData.rol] || '/dashboard';
      navigate(targetPath);
    } catch (err) {
      console.error(err);
      // El backend devuelve retry_after cuando hay demasiados intentos (HTTP 429)
      if (err.retry_after) {
        startCountdown(err.retry_after);
        setError(`Demasiados intentos fallidos.`);
      } else if (err.message === 'USER_NOT_FOUND_OR_INACTIVE') {
        setError('Usuario no encontrado o cuenta inactiva.');
      } else if (err.message === 'WRONG_PASSWORD') {
        setError('Contraseña incorrecta.');
      } else {
        setError(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleLogin}>
      {error && (
        <div className={`p-3 rounded-lg border text-sm ${
          isBlocked
            ? 'bg-orange-50 text-orange-700 border-orange-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          <span>{error}</span>
          {isBlocked && (
            <span className="block font-semibold mt-1">
              Podrás intentarlo nuevamente en: {countdown}s
            </span>
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label htmlFor="user" className="text-sm font-medium text-[#444]">Usuario</label>
        <input
          type="text"
          id="user"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Ingresa tu usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          disabled={isBlocked}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" id="label-password" className="text-sm font-medium text-[#444]">Contraseña</label>
        <div className="relative">
          <input
            type="password"
            id="password"
            className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isBlocked}
            required
          />
          {/* Botón ojo para mostrar/ocultar */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              // Ojo tachado (ocultar)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7a9.77 9.77 0 012.168-3.532M6.343 6.343A9.77 9.77 0 0112 5c5 0 9 4 9 7a9.77 9.77 0 01-2.343 3.532M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
              </svg>
            ) : (
              // Ojo abierto (mostrar)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        className="bg-[#2c5364] text-white p-3 rounded-lg font-semibold hover:bg-[#203a43] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2" 
        disabled={loading || isBlocked}
      >
        {loading ? 'Cargando...' : isBlocked ? `Bloqueado — espera ${countdown}s` : 'Iniciar Sesión'}
      </button>
    </form>
  );
};

export default LoginForm;
