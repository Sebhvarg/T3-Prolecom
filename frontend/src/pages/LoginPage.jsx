import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Book, Target, Users } from 'lucide-react';
import logo from '../assets/Logo/logoHorizontal.webp';
import './LoginPage.css';

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
        'Administrador': '/admin/dashboard',
        'Moderador': '/moderador/dashboard',
        'Profesor': '/profesor/dashboard',
        'Ayudante': '/ayudante/dashboard',
        'Estudiante': '/estudiante/dashboard'
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
    <div className="login-page-container">
      {/* Lado izquierdo - Diseño Hero */}
      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-logo-container">
            <img src={logo} alt="PROLECOM Logo" className="hero-logo" />
          </div>
          
          <h2 className="hero-subtitle">Pro Learning Community</h2>
          
          <div className="hero-features">
            <div className="feature-item">
              <Book size={24} />
              <span>Cursos</span>
            </div>
            <span>•</span>
            <div className="feature-item">
              <Target size={24} />
              <span>Desafíos</span>
            </div>
            <span>•</span>
            <div className="feature-item">
              <Users size={24} />
              <span>Colaboración</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1>Iniciar Sesión</h1>
            <p>Ingresa tus credenciales para acceder a la plataforma</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="user">Usuario</label>
              <input
                type="text"
                id="user"
                placeholder="Ingresa tu usuario"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="login-footer">
            No tienes cuenta? 
            <Link to="/register" className="register-link">REGISTRATE</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
