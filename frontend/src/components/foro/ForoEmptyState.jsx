import PropTypes from 'prop-types';
import { HelpCircle, Plus } from 'lucide-react';

const ForoEmptyState = ({ onOpenCreateModal, isClosed }) => {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xs p-8 max-w-lg mx-auto my-6">
      <div className="w-16 h-16 bg-blue-50 text-[#2c5364] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">No hay preguntas aún</h3>
      <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
        {isClosed
          ? 'Este foro está cerrado para nuevas preguntas.'
          : 'Sé el primero en realizar una consulta o pregunta académica sobre este tema.'}
      </p>

      {!isClosed && onOpenCreateModal && (
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="mt-6 inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Hacer la primera pregunta</span>
        </button>
      )}
    </div>
  );
};

ForoEmptyState.propTypes = {
  onOpenCreateModal: PropTypes.func,
  isClosed: PropTypes.bool,
};

export default ForoEmptyState;
