import { useState, useEffect } from 'react';
import { adminService } from '../../api/adminService';
import { Activity, Database, Cpu, Clock, RefreshCw, User } from 'lucide-react';

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
    return <div className="py-12 text-center text-gray-500">Cargando monitor de salud y auditoría...</div>;
  }

  const health = healthData?.health || {};
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
      {/* Indicadores de Salud del Sistema (Sin tarjeta de almacenamiento) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Base de Datos (MySQL)</div>
            <div className="text-lg font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              {health.database || 'OK'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Cpu size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Memoria Usada / PHP</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">
              {health.memory_usage || '—'} <span className="text-xs font-normal text-gray-500">({health.php_version})</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Estado del Servidor</div>
            <div className="text-sm font-bold text-emerald-600 truncate max-w-[170px] mt-0.5">
              Activo{health.server_time ? ` (${new Date(health.server_time).toLocaleTimeString()})` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Visor de Auditoría y Logs */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-600" /> Auditoría de Logs de Usuarios & Sistema
            </h3>
            <p className="text-xs text-gray-500">Registros de acciones de usuarios almacenados en la tabla logs_actividad de la Base de Datos</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sub-pestañas */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveSubTab('activity')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeSubTab === 'activity' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Actividad de Usuarios ({activityLogs.length})
              </button>
              <button
                onClick={() => setActiveSubTab('system')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeSubTab === 'system' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Logs del Sistema
              </button>
            </div>

            <button
              onClick={fetchHealthLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              <RefreshCw size={14} /> Actualizar
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
            className="w-full sm:w-80 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {activeSubTab === 'system' && (
            <div className="flex gap-2 w-full sm:w-auto">
              {['ALL', 'ERROR', 'WARN', 'INFO'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedLevel === level ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level === 'ALL' ? 'Todos' : level}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pestaña 1: Logs de Actividad de Usuarios desde la BD (logs_actividad) */}
        {activeSubTab === 'activity' && (
          <div className="space-y-3">
            {filteredActivityLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No hay registros de actividad de usuarios almacenados en la base de datos con este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      <th className="py-2.5 px-3">Fecha / Hora</th>
                      <th className="py-2.5 px-3">Usuario</th>
                      <th className="py-2.5 px-3">Acción Registrada en BD (logs_actividad)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredActivityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-gray-500 font-mono">
                          {log.created_at} <span className="text-[10px] text-gray-400">({log.time})</span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="text-blue-500" />
                            <span>{log.usuario}</span>
                            <span className="text-gray-400 font-normal">(@{log.username})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 font-medium rounded border border-blue-100">
                            {log.accion}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pestaña 2: System Logs */}
        {activeSubTab === 'system' && (
          <div className="space-y-3">
            {filteredSystemLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No hay logs del sistema coincidentes.
              </div>
            ) : (
              filteredSystemLogs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.color}`}></span>
                      <span className="font-semibold text-gray-800">{log.level}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 rounded">{log.env}</span>
                    </div>
                    <span>{log.time}</span>
                  </div>
                  <div className="text-gray-700 break-words font-sans text-xs pt-1">{log.message}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthMonitor;
