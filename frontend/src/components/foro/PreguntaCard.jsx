import PropTypes from 'prop-types';
import { MessageSquare, Pin, Eye, MoreVertical, Edit, Trash2, Flag } from 'lucide-react';
import { useState } from 'react';
import OfficialAnswerBadge from './OfficialAnswerBadge';
import { timeAgo } from '../../utils/timeAgo';

const PreguntaCard = ({
  pregunta,
  currentUser,
  onSelect,
  onPinToggle,
  onEdit,
  onDelete,
  onReport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const authorName = pregunta.creador?.nombreCompleto || 'Usuario';
  const authorRole = pregunta.creador?.roles?.[0]?.rol || 'Estudiante';

  const isAuthor = currentUser?.idUsuario === pregunta.idUsuarioCreador;
  const isStaff = currentUser?.roles?.some(r =>
    ['Administrador', 'Moderador', 'Profesor', 'Ayudante'].includes(r.rol || r)
  );
  const isSuperior = currentUser?.roles?.some(r =>
    ['Administrador', 'Moderador'].includes(r.rol || r)
  );

  const canEdit = isAuthor || isSuperior;
  const canDelete = isAuthor || isSuperior;
  const canPin = isStaff;

  return (
    <div className={`bg-white rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
      pregunta.fijada
        ? 'border-purple-200 bg-purple-50/20 shadow-xs hover:border-purple-300'
        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
    }`}>
      {/* Indicador visual de fijado */}
      {pregunta.fijada && (
        <div className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 inline-flex items-center gap-1 rounded-br-lg">
          <Pin size={10} className="fill-current" />
          <span>Fijada por el Profesor</span>
        </div>
      )}

      <button
        type="button"
        className="p-5 text-left w-full cursor-pointer focus:outline-none block"
        onClick={() => onSelect(pregunta.idPregunta)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Badges de Estado y Creador */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
              {pregunta.tiene_respuesta_validada ? (
                <OfficialAnswerBadge size="small" validatorRole="Oficial" />
              ) : pregunta.estado === 'resuelta' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Resuelta
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Abierta
                </span>
              )}

              <span className="font-semibold text-gray-700">{authorName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold uppercase">
                {authorRole}
              </span>
              <span>·</span>
              <span>{timeAgo(pregunta.created_at)}</span>
              {pregunta.editado && <span className="italic text-gray-400">(editado)</span>}
            </div>

            {/* Título de la Pregunta */}
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2c5364] transition-colors leading-snug">
              {pregunta.titulo}
            </h3>

            {/* Descripción corta */}
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {pregunta.descripcion}
            </p>
          </div>

          {/* Menú de Opciones (...) */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 w-44 py-1.5 text-xs font-semibold text-gray-700 animate-fade-in">
                  {canPin && (
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); onPinToggle(pregunta.idPregunta); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-purple-700"
                    >
                      <Pin size={14} />
                      <span>{pregunta.fijada ? 'Desfijar' : 'Fijar al tope'}</span>
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); onEdit(pregunta); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit size={14} />
                      <span>Editar</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); onDelete(pregunta.idPregunta); }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar</span>
                    </button>
                  )}

                  {!isAuthor && (
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); onReport(pregunta.idPregunta); }}
                      className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 flex items-center gap-2 border-t border-gray-100"
                    >
                      <Flag size={14} />
                      <span>Reportar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métrica de Vistas y Respuestas */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100/70 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye size={14} className="text-gray-400" />
              <span>{pregunta.vistas ?? 0} vistas</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-[#2c5364] bg-blue-50/70 px-3 py-1 rounded-xl">
            <MessageSquare size={14} />
            <span>{pregunta.respuestas_count ?? 0} respuestas</span>
          </div>
        </div>
      </button>
    </div>
  );
};

PreguntaCard.propTypes = {
  pregunta: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onPinToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
};

export default PreguntaCard;
