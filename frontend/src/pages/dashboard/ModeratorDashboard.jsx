import { useState, useEffect } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { useModeracionActions } from '../../hooks/useModeracionActions';
import { 
  ShieldAlert, AlertCircle, CheckCircle2, Eye, EyeOff, Ban, 
  Loader2, Filter, RefreshCw, X, MessageSquare, FileText, HelpCircle, Check 
} from 'lucide-react';
import { timeAgo } from '../../utils/timeAgo';

const ModeratorDashboard = () => {
  const [stats, setStats] = useState({
    pendientes: 0,
    resueltos: 0,
    contenidosOcultos: 0,
    usuariosSancionados: 0,
  });

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState('reportes');
  const [auditorias, setAuditorias] = useState([]);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const {
    actionLoading,
    error, setError,
    success, setSuccess,
    banModal, setBanModal,
    fetchModeracionData,
    handleResolver,
    handleOcultar,
    handleUnban,
    handleBanearConfirm,
  } = useModeracionActions({ filtroEstado, filtroTipo, setStats, setReportes, setAuditorias, setLoading });

  useEffect(() => {
    fetchModeracionData();
  }, [fetchModeracionData]);

  useEffect(() => {
    if (!error && !success) return undefined;
    const timer = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
    return () => clearTimeout(timer);
  }, [error, success, setError, setSuccess]);

  const renderOcultarButton = (rep, isOculto) => {
    if (!rep.contenido) return null;
    const btnClass = isOculto
      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs';
    const btnIcon = isOculto ? <Eye size={13} /> : <EyeOff size={13} />;
    const btnText = isOculto ? 'Restaurar Contenido' : 'Ocultar Contenido';
    return (
      <button
        type="button"
        disabled={actionLoading}
        onClick={() => handleOcultar(rep.idReporte)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${btnClass}`}
      >
        {btnIcon}
        <span>{btnText}</span>
      </button>
    );
  };

  const renderUserActionBtn = (rep, isAutorBaneado) => {
    if (!rep.autor) return null;
    if (isAutorBaneado) {
      return (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => handleUnban(rep.autor.idUsuario)}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <CheckCircle2 size={13} />
          <span>Reactivar Usuario</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={actionLoading}
        onClick={() => setBanModal({ isOpen: true, user: rep.autor })}
        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Ban size={13} />
        <span>Banear Usuario</span>
      </button>
    );
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'pregunta':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-semibold uppercase flex items-center gap-1 w-fit">
            <MessageSquare size={12} className="text-slate-500" /> Pregunta
          </span>
        );
      case 'respuesta':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-semibold uppercase flex items-center gap-1 w-fit">
            <HelpCircle size={12} className="text-slate-500" /> Respuesta
          </span>
        );
      case 'material':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-semibold uppercase flex items-center gap-1 w-fit">
            <FileText size={12} className="text-slate-500" /> Material
          </span>
        );
      default:
        return null;
    }
  };

  const renderReportesContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 size={32} className="animate-spin text-slate-700 mb-3" />
          <p className="text-xs font-medium text-slate-500">Cargando reportes de moderación...</p>
        </div>
      );
    }

    if (reportes.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8">
          <CheckCircle2 size={42} className="text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No hay reportes pendientes</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-normal">
            Todo está bajo control. No se han encontrado publicaciones reportadas con los filtros seleccionados.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reportes.map((rep) => {
          const isResuelto = rep.estado === 'resuelto';
          const isOculto = rep.contenido?.estado === 'oculta' || rep.contenido?.oculta;
          const isAutorBaneado = rep.autor?.idEstado === 4;
          const reporteCardClass = isResuelto
            ? 'bg-slate-50/70 border-slate-200 opacity-80'
            : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300';
          const estadoLabel = isResuelto ? 'Resuelto' : 'Pendiente';
          const estadoBadgeClass = isResuelto ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200';

          return (
            <div 
              key={rep.idReporte}
              className={`p-6 rounded-2xl border transition-all space-y-4 ${reporteCardClass}`}
            >
              {/* Encabezado del Reporte */}
              <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getTipoBadge(rep.tipoPublicacion)}

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase border ${estadoBadgeClass}`}>
                    {estadoLabel}
                  </span>

                  <span className="text-xs text-slate-400 font-normal">· Reportado {timeAgo(rep.fecha)}</span>
                </div>

                <span className="text-xs text-slate-500 font-normal">
                  Reportado por: <strong className="text-slate-800 font-semibold">{rep.reportador?.nombreCompleto || 'Usuario'}</strong>
                </span>
              </div>

              {/* Detalle del Motivo y Descripción del Reporte */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-700 shrink-0" />
                  <span>Motivo del Reporte: {rep.motivo}</span>
                </p>
                {rep.descripcion && (
                  <p className="text-xs text-amber-800 font-normal pl-5">{rep.descripcion}</p>
                )}
              </div>

              {/* Contenido Reportado Original */}
              {rep.contenido ? (
                <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Contenido de la Publicación:</span>
                    {isOculto && (
                      <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                        <EyeOff size={10} /> Ocultado actualmente
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-900">{rep.contenido.titulo}</h4>
                  <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rep.contenido.texto}
                  </p>

                  {/* Info del Autor */}
                  {rep.autor && (
                    <div className="flex justify-between items-center pt-1 text-xs text-slate-500 font-normal">
                      <span>Autor: <strong className="text-slate-900 font-semibold">{rep.autor.nombreCompleto}</strong> (@{rep.autor.usuario})</span>
                      {isAutorBaneado ? (
                        <span className="text-rose-700 font-semibold text-[10px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                          <Ban size={10} /> Usuario Baneado
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Cuenta Activa
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">La publicación reportada ha sido eliminada o no se encuentra disponible.</p>
              )}

              {/* Botones de Acción Rápida */}
              <div className="flex flex-wrap justify-end items-center gap-2 pt-2 border-t border-slate-100">
                {/* Botón Ocultar / Mostrar */}
                {renderOcultarButton(rep, isOculto)}

                {/* Botón Banear / Reactivar Usuario */}
                {renderUserActionBtn(rep, isAutorBaneado)}

                {/* Botón Resolver Reporte */}
                {!isResuelto && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleResolver(rep.idReporte)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Marcar Resuelto</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardContainer activeSection="Moderación" title="Panel de Moderación y Control">
      <div className="space-y-6">
        
        {/* Floating Toast Notification */}
        {(error || success) && (
          <div className="fixed top-6 right-6 z-[120] max-w-md w-full animate-fade-in shadow-xl rounded-2xl p-4 border border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300">
            <div className="flex items-center gap-3">
              {error ? (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-xl shrink-0 border border-rose-200">
                  <AlertCircle size={18} />
                </div>
              ) : (
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl shrink-0 border border-emerald-200">
                  <CheckCircle2 size={18} />
                </div>
              )}
              <div>
                <p className={`text-xs font-bold ${error ? 'text-rose-900' : 'text-emerald-900'}`}>
                  {error ? 'Atención' : 'Operación Exitosa'}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {error || success}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setError(''); setSuccess(''); }}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Encabezado Principal y Pestañas Segmentadas */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-semibold rounded-md uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={13} className="text-slate-600" /> Control Académico & Moderación
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Panel de Supervisión de Contenido</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Revisa los reportes emitidos por los estudiantes, oculta contenido malintencionado y gestiona sanciones.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Pestañas de navegación tipo Segmented Control */}
            <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('reportes')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'reportes'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reportes ({stats.pendientes || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auditoria')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'auditoria'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auditoría ({auditorias.length || 0})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchModeracionData}
              className="p-2.5 bg-white hover:bg-slate-100 rounded-xl transition-all text-slate-700 border border-slate-200/80 shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-medium shrink-0"
              title="Actualizar datos"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas del Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Reportes Pendientes</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.pendientes}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Reportes Resueltos</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.resueltos}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <EyeOff size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Contenidos Ocultados</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.contenidosOcultos}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <Ban size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Usuarios Baneados</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.usuariosSancionados}</h3>
            </div>
          </div>
        </div>

        {activeTab === 'auditoria' && (
          /* TABLA DE REGISTROS DE AUDITORÍA CON ZEBRA STRIPING */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Registro de Auditoría de Acciones del Sistema</h3>
                <p className="text-xs text-slate-500">Historial en tiempo real de operaciones de administradores, profesores y moderadores.</p>
              </div>
              <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200/60">
                Total: {auditorias.length} registros
              </span>
            </div>

            {auditorias.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium text-xs">
                No hay registros de auditoría almacenados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f2027] text-white uppercase tracking-wider font-semibold border-b border-[#1e3a47] text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Fecha y Hora</th>
                      <th className="px-5 py-3.5">Usuario</th>
                      <th className="px-5 py-3.5">Rol</th>
                      <th className="px-5 py-3.5">Acción</th>
                      <th className="px-5 py-3.5">Entidad</th>
                      <th className="px-5 py-3.5">Detalles</th>
                      <th className="px-5 py-3.5">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditorias.map((aud, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <tr
                          key={aud.idAuditoria}
                          className={`transition-colors ${
                            isEven ? 'bg-white' : 'bg-slate-50/75'
                          } hover:bg-slate-100/70 border-b border-slate-100`}
                        >
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {timeAgo(aud.created_at)}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900">{aud.nombreUsuario || 'Sistema'}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] uppercase border border-slate-200">
                              {aud.rolUsuario || 'Usuario'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-mono font-medium text-[10px] border border-slate-200">
                              {aud.accion}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-800">{aud.entidad} #{aud.entidad_id || '-'}</td>
                          <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{aud.detalles || '-'}</td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{aud.ip_address || '127.0.0.1'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reportes' && (
          <>
            {/* Barra de Filtros Sobria */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Filter size={15} className="text-slate-500" /> Filtros:
                </span>
                
                {/* Filtro Estado */}
                <div className="flex bg-slate-100/90 p-1 rounded-xl text-xs font-medium border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('pendiente')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filtroEstado === 'pendiente' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pendientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('resuelto')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filtroEstado === 'resuelto' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Resueltos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('todos')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filtroEstado === 'todos' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Filtro Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer w-full sm:w-auto"
              >
                <option value="todos">Todos los Tipos de Publicación</option>
                <option value="pregunta">Solo Preguntas</option>
                <option value="respuesta">Solo Respuestas</option>
                <option value="material">Solo Materiales</option>
              </select>
            </div>

            {/* Listado de Reportes */}
            {renderReportesContent()}
          </>
        )}

        {/* Modal Confirmación Banear Usuario */}
        {banModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <Ban size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Banear a @{banModal.user?.usuario}?</h3>
                <p className="text-xs text-slate-500 font-normal mt-1">
                  Esta acción revocará inmediatamente las credenciales y el acceso del usuario <strong>{banModal.user?.nombreCompleto}</strong> a la plataforma.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModal({ isOpen: false, user: null })}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleBanearConfirm}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Sí, Banear'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
};

export default ModeratorDashboard;
