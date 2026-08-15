import PropTypes from 'prop-types';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertTriangle,
          btnBg: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'info':
      default:
        return {
          icon: HelpCircle,
          btnBg: 'bg-[#2c5364] hover:bg-[#203a43] text-white',
        };
    }
  };

  const { icon: Icon, btnBg } = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} icon={Icon} maxWidth="max-w-md">
      <div className="space-y-6">
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 ${btnBg}`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning', 'info']),
  loading: PropTypes.bool,
};

export default ConfirmModal;
