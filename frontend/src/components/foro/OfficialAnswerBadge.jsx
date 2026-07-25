import PropTypes from 'prop-types';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Visual badge for "Official Answer Label" (PB16)
 * Displayed on answers validated by Instructors / TAs.
 */
const OfficialAnswerBadge = ({ validatorRole = 'Instructor', size = 'medium' }) => {
  const isSmall = size === 'small';

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/30 backdrop-blur-md animate-fade-in transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/30 select-none">
      <div className="relative flex items-center justify-center">
        <ShieldCheck className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4 text-emerald-100"} />
        <Sparkles className="w-2 h-2 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <span className={`font-bold tracking-wide uppercase ${isSmall ? 'text-[10px]' : 'text-xs'} text-white`}>
        Respuesta Oficial
      </span>
      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-medium text-emerald-50 backdrop-blur-sm hidden sm:inline-block">
        {validatorRole}
      </span>
      <CheckCircle2 className={isSmall ? "w-3 h-3 text-emerald-200" : "w-3.5 h-3.5 text-emerald-200"} />
    </div>
  );
};

OfficialAnswerBadge.propTypes = {
  validatorRole: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default OfficialAnswerBadge;
