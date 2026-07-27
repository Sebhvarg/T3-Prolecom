import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, Code, HelpCircle, Eye, Edit3 } from 'lucide-react';
import CodeBlock from './CodeBlock';

const NuevaPreguntaModal = ({ isOpen, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [activeTab, setActiveTab] = useState('escribir'); // 'escribir' | 'preview'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim()) return;
    onSubmit(form);
  };

  const handleInsertCodeSnippet = () => {
    setForm((prev) => ({
      ...prev,
      descripcion: prev.descripcion + '\n```python\n# Escribe o pega tu código aquí\n\n```\n',
    }));
    setActiveTab('escribir');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#2c5364] rounded-2xl">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Publicar Nueva Pregunta</h3>
              <p className="text-xs text-gray-500">Haz una consulta detallada a la comunidad académica.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="modal-titulo" className="block text-sm font-bold text-gray-700 mb-1.5">
              Título de la consulta <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-titulo"
              type="text"
              required
              placeholder="Ej: ¿Por qué obtengo IndexError en este bucle for?"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
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

              <button
                type="button"
                onClick={handleInsertCodeSnippet}
                className="text-xs text-[#2c5364] hover:text-[#203a43] font-semibold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <Code size={13} />
                <span>Bloque de código</span>
              </button>
            </div>

            {activeTab === 'escribir' ? (
              <>
                <textarea
                  id="modal-descripcion"
                  required
                  rows={6}
                  placeholder="Explica en detalle tu problema. Puedes encerrar tu código entre ```python ... ``` para darle formato."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c5364] text-sm font-mono resize-none leading-relaxed"
                />
                <p className="text-[11px] text-gray-400 mt-1">Tip: Usa ```lenguaje para resaltar sintaxis (python, javascript, c, etc.)</p>
              </>
            ) : (
              <div className="w-full border border-gray-200 rounded-xl p-4 min-h-40 bg-gray-50/50 max-h-60 overflow-y-auto">
                {form.descripcion.trim() ? (
                  <CodeBlock content={form.descripcion} />
                ) : (
                  <span className="text-xs text-gray-400 italic">No hay contenido para previsualizar. Escribe algo primero.</span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 text-gray-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.titulo.trim() || !form.descripcion.trim()}
              className="inline-flex items-center gap-2 bg-[#2c5364] hover:bg-[#203a43] disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Publicar Pregunta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NuevaPreguntaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default NuevaPreguntaModal;
