import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 120; // 2 minutos

const LoginForm = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null); // timestamp ms
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const isLocked = lockedUntil !== null;

  // Cuenta regresiva mientras está bloqueado
  useEffect(() => {
    if (isLocked) {
      const updateCountdown = () => {
        const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (secs <= 0) {
          setLockedUntil(null);
          setAttempts(0);
          setCountdown(0);
          setError('');
          clearInterval(timerRef.current);
        } else {
          setCountdown(secs);
        }
      };
      updateCountdown();
      timerRef.current = setInterval(updateCountdown, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isLocked, lockedUntil]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setError('');
    setLoading(true);

    try {
      const userData = await login(user, password);
      // Éxito: limpiar intentos
      setAttempts(0);
      setLockedUntil(null);

      const roleRedirects = {
        'Administrador': '/admin',
        'Moderador': '/moderador/dashboard',
        'Profesor': '/profesor/dashboard',
        'Ayudante': '/ayudante/dashboard',
        'Estudiante': '/dashboard/estudiante'
      };

      const targetPath = roleRedirects[userData.rol] || '/dashboard';
      navigate(targetPath);
    } catch (err) {
      console.error(err);

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockedUntil(until);
        setCountdown(LOCKOUT_SECONDS);
        setError(`Has alcanzado el límite de ${MAX_ATTEMPTS} intentos. Por seguridad, espera 2 minutos antes de volver a intentarlo.`);
      } else {
        const left = MAX_ATTEMPTS - newAttempts;
        if (err.message === 'USER_NOT_FOUND_OR_INACTIVE') {
          setError(`Usuario no encontrado o cuenta inactiva. ${left} intento${left !== 1 ? 's' : ''} restante${left !== 1 ? 's' : ''}.`);
        } else if (err.message === 'WRONG_PASSWORD') {
          setError(`Contraseña incorrecta. ${left} intento${left !== 1 ? 's' : ''} restante${left !== 1 ? 's' : ''}.`);
        } else {
          setError(`Error al iniciar sesión. ${left} intento${left !== 1 ? 's' : ''} restante${left !== 1 ? 's' : ''}.`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isLocked, login, user, password, attempts, navigate]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleLogin}>
      {/* Banner de bloqueo */}
      {isLocked && (
        <div className="bg-orange-50 text-orange-700 p-4 rounded-lg border border-orange-200 text-sm flex flex-col gap-1">
          <span>Demasiados intentos fallidos. Podrás intentarlo de nuevo en:</span>
          <span className="text-2xl font-bold tracking-widest text-center mt-1">
            {formatCountdown(countdown)}
          </span>
        </div>
      )}

      {/* Mensaje de error / intentos restantes */}
      {error && !isLocked && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}


      
      <div className="flex flex-col gap-2">
        <label htmlFor="user" className="text-sm font-medium text-[#444]">Usuario <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="user"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50 disabled:cursor-not-allowed"
          placeholder="Ingresa tu usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          disabled={isLocked}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" id="label-password" className="text-sm font-medium text-[#444]">Contraseña <span className="text-red-500">*</span></label>
        <input
          type="password"
          id="password"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50 disabled:cursor-not-allowed"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLocked}
          required
        />
      </div>

      <button 
        type="submit" 
        className="bg-[#2c5364] text-white p-3 rounded-lg font-semibold hover:bg-[#203a43] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2" 
        disabled={loading || isLocked}
      >
        {loading ? 'Cargando...' : isLocked ? `Bloqueado (${formatCountdown(countdown)})` : 'Iniciar Sesión'}
      </button>
    </form>
  );
};

export default LoginForm;
