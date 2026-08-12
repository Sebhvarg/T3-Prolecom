import { useState, useEffect, useCallback } from 'react';
import DashboardContainer from '../../components/layout/DashboardContainer';
import { moderacionService } from '../../api/moderacionService';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('reportes'); // 'reportes' | 'auditoria'
  const [auditorias, setAuditorias] = useState([]);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('pendiente'); // 'pendiente' | 'resuelto' | 'todos'
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'pregunta' | 'respuesta' | 'material'

  // Modal Confirmación Baneo
  const [banModal, setBanModal] = useState({ isOpen: false, user: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchModeracionData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, reportesData, auditoriaData] = await Promise.all([
        moderacionService.getStats(),
        moderacionService.getReportes({ estado: filtroEstado, tipo: filtroTipo }),
        moderacionService.getAuditoria(),
      ]);
      setStats(statsData);
      setReportes(reportesData);
      setAuditorias(auditoriaData || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información de moderación.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsData, reportesData] = await Promise.all([
          moderacionService.getStats(),
          moderacionService.getReportes({ estado: filtroEstado, tipo: filtroTipo }),
        ]);
        if (isMounted) {
          setStats(statsData);
          setReportes(reportesData);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Error al cargar la información de moderación.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [filtroEstado, filtroTipo]);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Acciones de Moderación
  const handleResolver = async (idReporte) => {
    setActionLoading(true);
    try {
      await moderacionService.resolverReporte(idReporte);
      setSuccess('Reporte marcado como resuelto exitosamente.');
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('No se pudo resolver el reporte.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOcultar = async (idReporte) => {
    setActionLoading(true);
    try {
      const res = await moderacionService.ocultarPublicacion(idReporte);
      setSuccess(res.message || 'Estado de publicación actualizado.');
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('No se pudo modificar la visibilidad de la publicación.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanearConfirm = async () => {
    if (!banModal.user) return;
    setActionLoading(true);
    try {
      const res = await moderacionService.banearUsuario(banModal.user.idUsuario, 4); // 4 = Baneado
      setSuccess(res.message || 'Usuario sancionado exitosamente.');
      setBanModal({ isOpen: false, user: null });
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('Error al aplicar sanción al usuario.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (idUsuario) => {
    setActionLoading(true);
    try {
      const res = await moderacionService.banearUsuario(idUsuario, 1); // 1 = Activo
      setSuccess(res.message || 'Usuario reactivado exitosamente.');
      fetchModeracionData();
    } catch (err) {
      console.error(err);
      setError('Error al reactivar cuenta del usuario.');
    } finally {
      setActionLoading(false);
    }
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'pregunta':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 w-fit">
            <MessageSquare size={12} /> Pregunta
          </span>
        );
      case 'respuesta':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 w-fit">
            <HelpCircle size={12} /> Respuesta
          </span>
        );
      case 'material':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 w-fit">
            <FileText size={12} /> Material
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardContainer activeSection="Moderación" title="Panel de Moderación y Control">
      <div className="space-y-6">
        
        {/* Floating Toast Notification */}
        {(error || success) && (
          <div className="fixed top-6 right-6 z-[120] max-w-md w-full animate-fade-in shadow-2xl rounded-2xl p-4 border bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300">
            <div className="flex items-center gap-3">
              {error ? (
                <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0">
                  <AlertCircle size={20} />
                </div>
              ) : (
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle2 size={20} />
                </div>
              )}
              <div>
                <p className={`text-xs font-extrabold ${error ? 'text-red-900' : 'text-emerald-900'}`}>
                  {error ? 'Atención' : 'Operación Exitosa'}
                </p>
                <p className={`text-xs font-semibold mt-0.5 ${error ? 'text-red-700' : 'text-emerald-700'}`}>
                  {error || success}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setError(''); setSuccess(''); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#2c5364] rounded-3xl p-6 md:p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} /> Control Académico & Moderación
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Panel de Supervisión de Contenido</h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-xl font-medium">
              Revisa los reportes emitidos por los estudiantes, oculta contenido malintencionado y gestiona las sanciones a usuarios infractores.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchModeracionData}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all text-white border border-white/20 cursor-pointer hidden sm:flex items-center gap-2 text-xs font-bold shrink-0"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Métricas del Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-amber-100 text-amber-800 rounded-2xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Reportes Pendientes</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.pendientes}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Reportes Resueltos</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.resueltos}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-blue-100 text-blue-800 rounded-2xl">
              <EyeOff size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Contenidos Ocultados</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.contenidosOcultos}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-red-100 text-red-800 rounded-2xl">
              <Ban size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Usuarios Baneados</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.usuariosSancionados}</h3>
            </div>
          </div>
        </div>

        {/* Pestañas Principales: Reportes vs Auditoría */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit border border-slate-300/60 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('reportes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reportes' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={16} className="text-red-500" />
            <span>Reportes de Contenido ({reportes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'auditoria' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={16} className="text-[#2c5364]" />
            <span>Historial de Auditoría ({auditorias.length})</span>
          </button>
        </div>

        {activeTab === 'auditoria' ? (
          /* TABLA DE REGISTROS DE AUDITORÍA */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Registro de Auditoría de Acciones del Sistema</h3>
                <p className="text-xs text-slate-500">Historial en tiempo real de operaciones de administradores, profesores y moderadores.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                Total: {auditorias.length} registros
              </span>
            </div>

            {auditorias.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-sm">
                No hay registros de auditoría almacenados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Fecha y Hora</th>
                      <th className="px-6 py-3.5">Usuario</th>
                      <th className="px-6 py-3.5">Rol</th>
                      <th className="px-6 py-3.5">Acción</th>
                      <th className="px-6 py-3.5">Entidad</th>
                      <th className="px-6 py-3.5">Detalles</th>
                      <th className="px-6 py-3.5">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditorias.map((aud) => (
                      <tr key={aud.idAuditoria} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {timeAgo(aud.created_at)}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{aud.nombreUsuario || 'Sistema'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px] uppercase">
                            {aud.rolUsuario || 'Usuario'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-mono font-bold text-[10px]">
                            {aud.accion}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{aud.entidad} #{aud.entidad_id || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{aud.detalles || '-'}</td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{aud.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1 mr-2">
              <Filter size={14} className="text-[#2c5364]" /> Filtros:
            </span>
            
            {/* Filtro Estado */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFiltroEstado('pendiente')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroEstado === 'pendiente' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Pendientes
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('resuelto')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroEstado === 'resuelto' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Resueltos
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroEstado === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
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
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="todos">Todos los Tipos de Publicación</option>
            <option value="pregunta">Solo Preguntas</option>
            <option value="respuesta">Solo Respuestas</option>
            <option value="material">Solo Materiales</option>
          </select>
        </div>

        {/* Listado de Reportes */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 size={36} className="animate-spin text-[#2c5364] mb-3" />
            <p className="text-xs font-bold text-slate-500">Cargando reporte de moderación...</p>
          </div>
        ) : reportes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs p-8">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900">No hay reportes pendientes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              Todo está bajo control. No se han encontrado publicaciones reportadas con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((rep) => {
              const isResuelto = rep.estado === 'resuelto';
              const isOculto = rep.contenido?.estado === 'oculta' || rep.contenido?.oculta;
              const isAutorBaneado = rep.autor?.idEstado === 4;

              return (
                <div 
                  key={rep.idReporte}
                  className={`p-6 rounded-3xl border transition-all space-y-4 ${
                    isResuelto 
                      ? 'bg-slate-50/70 border-slate-200 opacity-80' 
                      : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Encabezado del Reporte */}
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTipoBadge(rep.tipoPublicacion)}

                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                        isResuelto ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {isResuelto ? 'Resuelto' : 'Pendiente'}
                      </span>

                      <span className="text-xs text-slate-400 font-medium">· Reportado {timeAgo(rep.fecha)}</span>
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                      Reportado por: <strong className="text-slate-800 font-bold">{rep.reportador?.nombreCompleto || 'Usuario'}</strong>
                    </span>
                  </div>

                  {/* Detalle del Motivo y Descripción del Reporte */}
                  <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-1">
                    <p className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-amber-700 shrink-0" />
                      <span>Motivo del Reporte: {rep.motivo}</span>
                    </p>
                    {rep.descripcion && (
                      <p className="text-xs text-amber-800 font-medium pl-5">{rep.descripcion}</p>
                    )}
                  </div>

                  {/* Contenido Reportado Original */}
                  {rep.contenido ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Contenido de la Publicación:</span>
                        {isOculto && (
                          <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <EyeOff size={10} /> Ocultado actualmente
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-extrabold text-slate-900">{rep.contenido.titulo}</h4>
                      <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200 max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {rep.contenido.texto}
                      </p>

                      {/* Info del Autor */}
                      {rep.autor && (
                        <div className="flex justify-between items-center pt-1 text-xs text-slate-500 font-medium">
                          <span>Autor: <strong className="text-slate-900 font-bold">{rep.autor.nombreCompleto}</strong> (@{rep.autor.usuario})</span>
                          {isAutorBaneado ? (
                            <span className="text-red-600 font-black text-[10px] bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                              <Ban size={10} /> Usuario Baneado
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                    {rep.contenido && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleOcultar(rep.idReporte)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isOculto 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                        }`}
                      >
                        {isOculto ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>{isOculto ? 'Restaurar Contenido' : 'Ocultar Contenido'}</span>
                      </button>
                    )}

                    {/* Botón Banear / Reactivar Usuario */}
                    {rep.autor && (
                      isAutorBaneado ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleUnban(rep.autor.idUsuario)}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 size={14} />
                          <span>Reactivar Usuario</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => setBanModal({ isOpen: true, user: rep.autor })}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Ban size={14} />
                          <span>Banear Usuario</span>
                        </button>
                      )
                    )}

                    {/* Botón Resolver Reporte */}
                    {!isResuelto && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleResolver(rep.idReporte)}
                        className="px-4 py-2 bg-[#2c5364] hover:bg-[#203a43] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Marcar Resuelto</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    )}
      {/* Modal Confirmación Banear Usuario */}
      {banModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Ban size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">¿Banear a @{banModal.user?.usuario}?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Esta acción revocará inmediatamente las credenciales y el acceso del usuario <strong>{banModal.user?.nombreCompleto}</strong> a la plataforma.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBanModal({ isOpen: false, user: null })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleBanearConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
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
