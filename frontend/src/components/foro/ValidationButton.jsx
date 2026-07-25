import PropTypes from 'prop-types';
import { useState } from 'react';
import { Award, Loader2, X } from 'lucide-react';
import { foroService } from '../../api/foroService';

/**
 * Validation button visible ONLY to authorized roles (TAs / Instructors / Admins) (PB16 RBAC)
 * Styled in alignment with the application's design system.
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

  const renderContent = () => {
    if (loading) {
      return <Loader2 size={14} className="animate-spin" />;
    }

    if (isValidated) {
      return (
        <>
          <X size={14} className="text-amber-700" />
          <span>Remover Validación</span>
        </>
      );
    }

    return (
      <>
        <Award size={14} />
        <span>Validar como Oficial</span>
      </>
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggleValidation}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-colors shadow-xs ${
        isValidated
          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
          : 'bg-[#2c5364] hover:bg-[#203a43] text-white'
      }`}
      title={isValidated ? 'Quitar validación oficial' : 'Validar como respuesta oficial'}
    >
      {renderContent()}
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
