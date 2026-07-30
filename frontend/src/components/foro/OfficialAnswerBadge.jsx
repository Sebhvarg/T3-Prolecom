import PropTypes from 'prop-types';
import { ShieldCheck } from 'lucide-react';

/**
 * Visual badge for "Official Answer Label" (PB16)
 * Aligned with the application's clean design system.
 */
const OfficialAnswerBadge = ({ validatorRole = 'Instructor', size = 'medium' }) => {
  const isSmall = size === 'small';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors select-none ${
        isSmall
          ? 'px-2.5 py-0.5 text-xs bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'px-3 py-1 text-xs bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      <ShieldCheck size={isSmall ? 14 : 16} className="text-emerald-600 shrink-0" />
      <span>Respuesta Oficial</span>
      {validatorRole && (
        <span className="text-[10px] bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 rounded font-medium ml-0.5">
          {validatorRole}
        </span>
      )}
    </span>
  );
};

OfficialAnswerBadge.propTypes = {
  validatorRole: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default OfficialAnswerBadge;
