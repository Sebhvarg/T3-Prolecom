import { useState, useEffect } from 'react';
import { adminService } from '../../api/adminService';
import { Activity, RefreshCw, User } from 'lucide-react';

const getLogLevelBg = (level = '') => {
  if (level.includes('ERR')) return 'bg-rose-500';
  if (level.includes('WARN')) return 'bg-amber-500';
  return 'bg-slate-400';
};

const SystemHealthMonitor = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('activity'); // 'activity' | 'system'
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  const fetchHealthLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getHealthLogs();
      setHealthData(data);
    } catch (err) {
      console.error('Error al obtener salud del sistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    adminService.getHealthLogs()
      .then((data) => {
        if (isMounted) setHealthData(data);
      })
      .catch((err) => {
        console.error('Error al obtener salud del sistema:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Cargando monitor de auditoría y logs...</div>;
  }

  const activityLogs = healthData?.activity_logs || [];
  const systemLogs = healthData?.system_logs || healthData?.logs || [];

  const filteredActivityLogs = activityLogs.filter((log) => {
    if (!logSearch) return true;
    const term = logSearch.toLowerCase();
    return (
      log.accion?.toLowerCase().includes(term) ||
      log.usuario?.toLowerCase().includes(term) ||
      log.username?.toLowerCase().includes(term) ||
      log.email?.toLowerCase().includes(term)
    );
  });

  const filteredSystemLogs = systemLogs.filter((log) => {
    const matchesLevel = selectedLevel === 'ALL' || log.level?.includes(selectedLevel);
    const matchesSearch = !logSearch || log.message?.toLowerCase().includes(logSearch.toLowerCase()) || log.time?.includes(logSearch);
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Visor de Auditoría y Logs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-slate-700" /> Auditoría de Logs de Usuarios & Sistema
            </h3>
            <p className="text-xs text-slate-500">Registros de acciones de usuarios almacenados en la tabla logs_actividad de la Base de Datos</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sub-pestañas */}
            <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('activity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeSubTab === 'activity' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Actividad de Usuarios ({activityLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('system')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeSubTab === 'system' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Logs del Sistema
              </button>
            </div>

            <button
              type="button"
              onClick={fetchHealthLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200/60 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>
        </div>

        {/* Buscador de Logs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <input
            type="text"
            placeholder={activeSubTab === 'activity' ? "Filtrar por acción, usuario o email..." : "Filtrar mensaje de error..."}
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="w-full sm:w-80 border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
          />

          {activeSubTab === 'system' && (
            <div className="flex gap-2 w-full sm:w-auto">
              {['ALL', 'ERROR', 'WARN', 'INFO'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedLevel === level ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level === 'ALL' ? 'Todos' : level}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pestaña 1: Logs de Actividad de Usuarios desde la BD (logs_actividad) con Zebra Striping */}
        {activeSubTab === 'activity' && (
          <div className="space-y-3">
            {filteredActivityLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay registros de actividad de usuarios almacenados en la base de datos con este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0f2027] text-white font-semibold uppercase tracking-wider border-b border-[#1e3a47] text-[11px]">
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Acción Registrada en BD (logs_actividad)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActivityLogs.map((log, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <tr
                          key={log.id}
                          className={`transition-colors ${
                            isEven ? 'bg-white' : 'bg-slate-50/75'
                          } hover:bg-slate-100/70 border-b border-slate-100`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {log.created_at} <span className="text-[10px] text-slate-400">({log.time})</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" />
                              <span>{log.usuario}</span>
                              <span className="text-slate-400 font-normal text-[11px]">(@{log.username})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-medium rounded-md border border-slate-200 text-[11px]">
                              {log.accion}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pestaña 2: System Logs con Zebra Striping */}
        {activeSubTab === 'system' && (
          <div className="space-y-2">
            {filteredSystemLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay logs del sistema coincidentes.
              </div>
            ) : (
              filteredSystemLogs.map((log, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-xl border border-slate-200/70 text-xs font-mono space-y-1 transition-colors ${
                      isEven ? 'bg-white' : 'bg-slate-50/70'
                    } hover:bg-slate-100/60`}
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getLogLevelBg(log.level)}`}></span>
                        <span className="font-bold text-slate-800">{log.level}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">{log.env}</span>
                      </div>
                      <span className="text-[11px]">{log.time}</span>
                    </div>
                    <div className="text-slate-700 break-words font-sans text-xs pt-1">{log.message}</div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthMonitor;
