import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import DashboardContainer from '../../components/layout/DashboardContainer';
import PasswordValidator from '../../components/auth/PasswordValidator';
import { User, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const PerfilPage = () => {
  const { user } = useAuth();

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [passwordActual, setPasswordActual]     = useState('');
  const [passwordNuevo, setPasswordNuevo]       = useState('');
  const [passwordConfirm, setPasswordConfirm]   = useState('');
  const [showActual, setShowActual]             = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [passwordValida, setPasswordValida]     = useState(false);

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  const confirmMatch = passwordNuevo && passwordConfirm && passwordNuevo === passwordConfirm;
  const confirmError = passwordConfirm && passwordNuevo !== passwordConfirm;

  const canSubmit =
    passwordActual.length > 0 &&
    passwordValida &&
    confirmMatch &&
    !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await authService.apiFetch('/perfil/password', {
        method: 'PUT',
        body: JSON.stringify({
          password_actual:     passwordActual,
          password_nuevo:      passwordNuevo,
          password_confirmado: passwordConfirm,
        }),
      });

      setSuccess(data.message || '¡Contraseña actualizada correctamente!');
      setPasswordActual('');
      setPasswordNuevo('');
      setPasswordConfirm('');
      setPasswordValida(false);
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContainer title="Mi Perfil" user={user}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Tarjeta de información del usuario ─────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#0f2027] rounded-full">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{user?.nombreCompleto}</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {user?.rol}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</span>
              <span className="text-gray-700 font-medium">@{user?.usuario}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo</span>
              <span className="text-gray-700 font-medium">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* ── Tarjeta de cambio de contraseña ────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Lock size={20} className="text-[#2c5364]" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Cambiar contraseña</h3>
          </div>

          {/* Mensajes de éxito/error */}
          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Contraseña actual */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password_actual" className="text-sm font-semibold text-gray-700">
                Contraseña actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showActual ? 'text' : 'password'}
                  id="password_actual"
                  className="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-gray-800"
                  placeholder="Ingresa tu contraseña actual"
                  value={passwordActual}
                  onChange={e => setPasswordActual(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowActual(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showActual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Nueva contraseña con validador */}
            <PasswordValidator
              password={passwordNuevo}
              userData={user}
              onChange={setPasswordNuevo}
              onValid={setPasswordValida}
            />

            {/* Confirmar contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password_confirm" className="text-sm font-semibold text-gray-700">
                Confirmar nueva contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="password_confirm"
                  className={`w-full p-3 pr-12 rounded-xl border focus:outline-none focus:ring-2 text-gray-800 transition-colors ${
                    confirmError
                      ? 'border-red-400 focus:ring-red-300'
                      : confirmMatch
                      ? 'border-green-400 focus:ring-green-300'
                      : 'border-gray-300 focus:ring-[#2c5364]'
                  }`}
                  placeholder="Repite tu nueva contraseña"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmError && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
              )}
              {confirmMatch && (
                <p className="text-xs text-green-600 mt-1 font-medium">✓ Las contraseñas coinciden.</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-[#2c5364] text-white p-3 rounded-xl font-semibold hover:bg-[#203a43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>

          </form>
        </div>
      </div>
    </DashboardContainer>
  );
};

export default PerfilPage;