import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(user, password);
      
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
      if (err.message === 'USER_NOT_FOUND_OR_INACTIVE') {
        setError('Usuario no encontrado o cuenta inactiva.');
      } else if (err.message === 'WRONG_PASSWORD') {
        setError('Contraseña incorrecta.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label htmlFor="user" className="text-sm font-medium text-[#444]">Usuario <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="user"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
          placeholder="Ingresa tu usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" id="label-password" className="text-sm font-medium text-[#444]">Contraseña <span className="text-red-500">*</span></label>
        <input
          type="password"
          id="password"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button 
        type="submit" 
        className="bg-[#2c5364] text-white p-3 rounded-lg font-semibold hover:bg-[#203a43] transition-colors disabled:opacity-70 mt-2" 
        disabled={loading}
      >
        {loading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};

export default LoginForm;
