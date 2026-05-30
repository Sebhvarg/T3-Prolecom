import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Book, Target, Users } from 'lucide-react';
import logo from '../assets/Logo/logoHorizontal.webp';

const LoginPage = () => {
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
      
      // Redirección según rol (usando nombre de rol del backend)
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
    <div className="flex min-h-screen w-full overflow-hidden font-sans">
      {/* Lado izquierdo - Diseño Hero */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] flex-col justify-center items-center text-white p-8 relative">
        <div className="max-w-[450px] text-left">
          <div className="mb-10">
            <img src={logo} alt="PROLECOM Logo" className="max-w-[320px] h-auto" />
          </div>
          
          <h2 className="text-2xl mb-8 font-normal opacity-90">Pro Learning Community</h2>
          
          <div className="flex gap-6 text-xl font-medium items-center">
            <div className="flex items-center gap-2">
              <Book size={24} />
              <span>Cursos</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Target size={24} />
              <span>Desafíos</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Users size={24} />
              <span>Colaboración</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="flex-1 bg-white flex justify-center items-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl text-[#111] mb-2 font-semibold">Iniciar Sesión</h1>
            <p className="text-[#666] text-base">Ingresa tus credenciales para acceder a la plataforma</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label htmlFor="user" className="text-sm font-medium text-[#444]">Usuario</label>
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
              <label htmlFor="password" id="label-password" className="text-sm font-medium text-[#444]">Contraseña</label>
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

          <div className="mt-8 text-center text-[#666] text-sm">
            No tienes cuenta? {' '}
            <Link to="/register" className="text-[#2c5364] font-bold hover:underline">REGISTRATE</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

