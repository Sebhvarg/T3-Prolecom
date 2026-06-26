import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_REDIRECTS } from '../../api/authService';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    usuario: '',
    email: '',
    password: '',
    fechaDeNacimiento: '',
    rol: 'Estudiante', // Default to Estudiante
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones del usuario
      if (!/^[A-Z]/.test(formData.usuario)) {
        throw new Error('El usuario debe comenzar con una letra mayúscula.');
      }
      if (/\s/.test(formData.usuario)) {
        throw new Error('El usuario no debe contener espacios.');
      }
      if (formData.usuario.length > 20) {
        throw new Error('El usuario no puede superar los 20 caracteres.');
      }

      // Validación de contraseña robusta con expresión regular
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        throw new Error('La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial.');
      }

      // Convert empty date of birth string to null for the API
      const apiPayload = {
        ...formData,
        fechaDeNacimiento: formData.fechaDeNacimiento || null,
      };

      const userData = await register(apiPayload);
      const targetPath = ROLE_REDIRECTS[userData.rol] || '/dashboard';
      navigate(targetPath);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al registrar el usuario. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [formData, register, navigate]);

  return (
    <form className="flex flex-col gap-5" onSubmit={handleRegister}>
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Nombre Completo */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombreCompleto" className="text-sm font-medium text-gray-700">
          Nombre Completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nombreCompleto"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50"
          placeholder="Ej. Juan Pérez"
          value={formData.nombreCompleto}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {/* Nombre de Usuario */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="usuario" className="text-sm font-medium text-gray-700">
          Usuario <span className="text-red-500">*</span>
          <span className="text-gray-400 text-xs block font-normal mt-0.5">Debe empezar con mayúscula, máximo 20 caracteres y sin espacios.</span>
        </label>
        <input
          type="text"
          id="usuario"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50"
          placeholder="Ej. JuanPerez10"
          maxLength={20}
          value={formData.usuario}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {/* Correo Electrónico */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Correo Electrónico <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50"
          placeholder="correo@ejemplo.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {/* Contraseña */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Contraseña (min. 8 caracteres, robusta) <span className="text-red-500">*</span>
          <span className="text-gray-400 text-xs block font-normal mt-0.5">Debe incluir mayúscula, minúscula, número y un carácter especial.</span>
        </label>
        <input
          type="password"
          id="password"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50"
          placeholder="Ej. Segura123!"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {/* Fecha de Nacimiento (Opcional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fechaDeNacimiento" className="text-sm font-medium text-gray-700">
          Fecha de Nacimiento <span className="text-gray-400 text-xs">(Opcional)</span>
        </label>
        <input
          type="date"
          id="fechaDeNacimiento"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 disabled:bg-gray-50"
          value={formData.fechaDeNacimiento}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {/* Rol */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rol" className="text-sm font-medium text-gray-700">
          Registrarme como <span className="text-red-500">*</span>
        </label>
        <select
          id="rol"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800 bg-white disabled:bg-gray-50"
          value={formData.rol}
          onChange={handleChange}
          disabled={loading}
          required
        >
          <option value="Estudiante">Estudiante</option>
          <option value="Profesor">Profesor</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-[#2c5364] text-white p-3 rounded-lg font-semibold hover:bg-[#203a43] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-3"
        disabled={loading}
      >
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
};

export default RegisterForm;
