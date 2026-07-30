import { useState } from 'react';
import PropTypes from 'prop-types';
import { MoreVertical, Edit, Trash2, Flag } from 'lucide-react';
import OfficialAnswerBadge from './OfficialAnswerBadge';
import ValidationButton from './ValidationButton';
import VoteButtons from './VoteButtons';
import CodeBlock from './CodeBlock';
import { timeAgo } from '../../utils/timeAgo';

const RespuestaItem = ({
  respuesta,
  currentUser,
  isAuthorizedToValidate,
  onStatusChange,
  onEdit,
  onDelete,
  onReport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const authorName = respuesta.usuario?.nombreCompleto || 'Usuario';
  const authorRole = respuesta.usuario?.roles?.[0]?.rol || 'Estudiante';
  const isAuthor = currentUser?.idUsuario === respuesta.idUsuario;
  const isSuperior = currentUser?.roles?.some(r =>
    ['Administrador', 'Moderador'].includes(r.rol || r)
  );

  const canEdit = isAuthor || isSuperior;
  const canDelete = isAuthor || isSuperior;

  const cardClasses = respuesta.validada
    ? 'p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs transition-all'
    : 'p-5 rounded-2xl border border-gray-100 bg-white shadow-xs transition-all';

  return (
    <div className={cardClasses}>
      {/* Encabezado de la Respuesta */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar abreviatura */}
          <div className="w-9 h-9 rounded-2xl bg-[#2c5364] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-gray-900">{authorName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                {authorRole}
              </span>
              <span className="text-xs text-gray-400">· {timeAgo(respuesta.created_at)}</span>
              {respuesta.editado && <span className="text-xs italic text-gray-400">(editado)</span>}
            </div>
          </div>
        </div>

        {/* Badges de Validación & Botón TA/Profe */}
        <div className="flex items-center gap-2">
          {respuesta.validada && (
            <OfficialAnswerBadge validatorRole={authorRole} size="small" />
          )}

          <ValidationButton
            respuestaId={respuesta.idRespuesta}
            isValidated={Boolean(respuesta.validada)}
            isAuthorized={isAuthorizedToValidate}
            onStatusChange={onStatusChange}
          />

          {/* Menú de Opciones */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 w-40 py-1.5 text-xs font-semibold text-gray-700 animate-fade-in">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); onEdit(respuesta); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={14} />
                    <span>Editar</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); onDelete(respuesta.idRespuesta); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                )}

                {!isAuthor && (
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); onReport(respuesta.idRespuesta); }}
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

      {/* Contenido de la Respuesta con Syntax Highlighting */}
      <div className="pl-12 text-gray-800">
        <CodeBlock content={respuesta.contenido} />
      </div>

      {/* Pie de la Respuesta — Botones de Voto (Like / Dislike) */}
      <div className="pl-12 mt-4 flex items-center justify-between">
        <VoteButtons
          respuestaId={respuesta.idRespuesta}
          likesCount={respuesta.likes_count ?? 0}
          dislikesCount={respuesta.dislikes_count ?? 0}
          miVoto={respuesta.mi_voto}
          isAuthor={isAuthor}
        />
      </div>
    </div>
  );
};

RespuestaItem.propTypes = {
  respuesta: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  isAuthorizedToValidate: PropTypes.bool.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
};

export default RespuestaItem;
