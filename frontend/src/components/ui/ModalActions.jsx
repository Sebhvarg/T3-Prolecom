import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const ModalActions = ({
  onCancel,
  cancelText = 'Cancelar',
  submitText = 'Guardar Cambios',
  submitting = false,
  disabled = false,
}) => {
  return (
    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={disabled || submitting}
        className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        <span>{submitText}</span>
      </button>
    </div>
  );
};

ModalActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  cancelText: PropTypes.string,
  submitText: PropTypes.string,
  submitting: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ModalActions;
