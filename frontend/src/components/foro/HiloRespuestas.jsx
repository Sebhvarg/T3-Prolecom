import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MessageSquare, User, ArrowLeft, Send, Loader2, Pin, Eye, Code,
  Edit3
} from 'lucide-react';
import RespuestaItem from './RespuestaItem';
import CodeBlock from './CodeBlock';
import OfficialAnswerBadge from './OfficialAnswerBadge';
import { timeAgo } from '../../utils/timeAgo';
import { foroService } from '../../api/foroService';

const HiloRespuestas = ({
  pregunta,
  currentUser,
  isAuthorizedToValidate,
  isForoClosed,
  onClose,
  onRefresh,
  onEditRespuesta,
  onDeleteRespuesta,
  onReportRespuesta,
}) => {
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [activeTab, setActiveTab] = useState('escribir'); // 'escribir' | 'preview'
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  if (!pregunta) return null;

  const authorName = pregunta.creador?.nombreCompleto || 'Usuario';
  const authorRole = pregunta.creador?.roles?.[0]?.rol || 'Estudiante';
  const respuestas = pregunta.respuestas || [];

  const handleCreateRespuesta = async (e) => {
    e.preventDefault();
    if (!nuevoContenido.trim() || submitting || isForoClosed) return;

    setSubmitting(true);
    try {
      await foroService.createRespuesta(pregunta.idPregunta, { contenido: nuevoContenido });
      setNuevoContenido('');
      setActiveTab('escribir');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al enviar la respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInsertCodeSnippet = () => {
    setNuevoContenido((prev) => prev + '\n```python\n# Escribe o pega tu código aquí\n\n```\n');
    setActiveTab('escribir');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Botón de Regreso a la lista de preguntas */}
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#2c5364] hover:text-[#115e59] bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Volver a las Preguntas del Foro</span>
      </button>

      {/* Cabecera con Degradado Premium */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] text-white rounded-3xl shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {pregunta.fijada && (
            <span className="px-3 py-1 rounded-full font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1">
              <Pin size={11} className="fill-current" /> Fijada
            </span>
          )}

          {pregunta.tiene_respuesta_validada || respuestas.some(r => r.validada) ? (
            <OfficialAnswerBadge size="small" validatorRole="Oficial" />
          ) : (
            <span className="px-3 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pregunta Abierta
            </span>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">{pregunta.titulo}</h2>

        <div className="flex items-center gap-4 text-xs text-white/80 pt-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium">
            <User size={14} />
            <span className="font-bold">{authorName}</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] uppercase font-bold">{authorRole}</span>
          </span>

          <span>· {timeAgo(pregunta.created_at)}</span>

          <span className="flex items-center gap-1 font-medium bg-white/10 px-2.5 py-1 rounded-lg">
            <Eye size={14} />
            <span>{pregunta.vistas ?? 0} vistas</span>
          </span>
        </div>
      </div>

      {/* Tarjeta de la Pregunta Original */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consulta Académica Original</h4>
        <div className="text-gray-800 text-sm md:text-base leading-relaxed">
          <CodeBlock content={pregunta.descripcion} />
        </div>
      </div>

      {/* Sección de Respuestas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#2c5364]" />
            <span>Respuestas en este Hilo ({respuestas.length})</span>
          </h3>
        </div>

        {respuestas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-3xl border border-gray-100 shadow-xs">
            Todavía no hay respuestas. ¡Sé el primero en aportar conocimientos!
          </div>
        ) : (
          <div className="space-y-4">
            {respuestas.map((resp) => (
              <RespuestaItem
                key={resp.idRespuesta}
                respuesta={resp}
                currentUser={currentUser}
                isAuthorizedToValidate={isAuthorizedToValidate}
                onStatusChange={onRefresh}
                onEdit={onEditRespuesta}
                onDelete={onDeleteRespuesta}
                onReport={onReportRespuesta}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formulario de Respuesta Enriquecido con Live Preview */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
        {isForoClosed ? (
          <div className="text-center py-3 text-xs font-bold text-amber-700 bg-amber-50 rounded-2xl border border-amber-200">
            🔒 Este foro ha sido cerrado por el profesor. No se pueden publicar nuevas respuestas.
          </div>
        ) : (
          <form onSubmit={handleCreateRespuesta} className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Tu Respuesta Académica:</span>
                {/* Pestañas Escribir / Vista Previa */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('escribir')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'escribir' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Edit3 size={13} />
                    <span>Escribir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'preview' ? 'bg-white text-[#2c5364] shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Vista previa</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInsertCodeSnippet}
                className="text-xs text-[#2c5364] hover:text-[#203a43] font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Code size={14} />
                <span>Bloque de código</span>
              </button>
            </div>

            {activeTab === 'escribir' ? (
              <textarea
                ref={textareaRef}
                rows={4}
                placeholder="Explica tu solución o comparte conocimientos en detalle... Puedes usar ```python ... ``` para formatear código."
                value={nuevoContenido}
                onChange={(e) => setNuevoContenido(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2c5364] resize-none leading-relaxed"
              />
            ) : (
              <div className="w-full border border-gray-200 rounded-2xl p-4 min-h-28 bg-gray-50/50 max-h-56 overflow-y-auto">
                {nuevoContenido.trim() ? (
                  <CodeBlock content={nuevoContenido} />
                ) : (
                  <span className="text-xs text-gray-400 italic">Escribe una respuesta para ver la vista previa en vivo.</span>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || !nuevoContenido.trim()}
                className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>Publicar Respuesta</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

HiloRespuestas.propTypes = {
  pregunta: PropTypes.object,
  currentUser: PropTypes.object,
  isAuthorizedToValidate: PropTypes.bool.isRequired,
  isForoClosed: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onEditRespuesta: PropTypes.func.isRequired,
  onDeleteRespuesta: PropTypes.func.isRequired,
  onReportRespuesta: PropTypes.func.isRequired,
};

export default HiloRespuestas;
