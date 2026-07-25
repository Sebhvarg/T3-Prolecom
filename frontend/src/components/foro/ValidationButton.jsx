import PropTypes from 'prop-types';
import { useState } from 'react';
import { Award, Check, Loader2, X } from 'lucide-react';
import { foroService } from '../../api/foroService';

/**
 * Validation button visible ONLY to authorized roles (TAs / Instructors / Admins) (PB16 RBAC)
 */
const ValidationButton = ({ respuestaId, isValidated, isAuthorized, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  if (!isAuthorized) {
    return null;
  }

  const handleToggleValidation = async () => {
    setLoading(true);
    try {
      const response = await foroService.toggleValidarRespuesta(respuestaId, !isValidated);
      if (onStatusChange) {
        onStatusChange(response.respuesta);
      }
    } catch (err) {
      console.error('Error al cambiar validación de respuesta:', err);
      alert(err.message || 'Error al actualizar el estado de validación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleValidation}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all duration-200 shadow-sm ${
        isValidated
          ? 'bg-amber-500/10 text-amber-700 border border-amber-300 hover:bg-amber-500/20 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
      }`}
      title={isValidated ? 'Quitar validación oficial' : 'Validar como respuesta oficial'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isValidated ? (
        <>
          <X className="w-3.5 h-3.5 text-amber-600" />
          <span>Remover Validación</span>
        </>
      ) : (
        <>
          <Award className="w-3.5 h-3.5" />
          <span>Validar como Oficial</span>
        </>
      )}
    </button>
  );
};

ValidationButton.propTypes = {
  respuestaId: PropTypes.number.isRequired,
  isValidated: PropTypes.bool.isRequired,
  isAuthorized: PropTypes.bool.isRequired,
  onStatusChange: PropTypes.func,
};

export default ValidationButton;
