import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react';
import { notificacionesService } from '../../api/notificacionesService';
import { timeAgo } from '../../utils/timeAgo';

const NotificacionesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await notificacionesService.getNotificaciones(1);
      const list = res.data || [];
      setNotificaciones(list);
      const unread = list.filter((n) => !n.leida).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
    // Polling ligero cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificaciones]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setLoading(true);
      fetchNotificaciones().finally(() => setLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const handleMarcarLeida = async (idNotificacion) => {
    try {
      await notificacionesService.marcarLeida(idNotificacion);
      setNotificaciones((prev) =>
        prev.map((n) => (n.idNotificacion === idNotificacion ? { ...n, leida: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.leida) {
      await handleMarcarLeida(n.idNotificacion);
    }
    setIsOpen(false);

    // Navegar al curso y hilo del foro si existen los datos
    const datos = typeof n.datos === 'string' ? JSON.parse(n.datos) : (n.datos || {});
    const idCurso = datos.idCurso;
    const idForo = datos.idForo;
    const idPregunta = datos.idPregunta;

    if (idCurso && idForo) {
      navigate(`/cursos/${idCurso}?foroId=${idForo}${idPregunta ? `&preguntaId=${idPregunta}` : ''}`);
    } else if (idCurso) {
      navigate(`/cursos/${idCurso}`);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (tipo) => {
    if (tipo === 'respuesta_validada') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (tipo === 'nueva_respuesta') {
      return <MessageSquare className="w-4 h-4 text-[#2c5364]" />;
    }
    return <ShieldAlert className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campanita */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all focus:outline-none cursor-pointer"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown de Notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
          {/* Encabezado */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <h3 className="font-bold text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodasLeidas}
                className="text-xs text-white/80 hover:text-white flex items-center gap-1 font-semibold transition"
              >
                <CheckCheck size={14} />
                <span>Marcar todas leídas</span>
              </button>
            )}
          </div>

          {/* Cuerpo - Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2c5364]" />
                <span className="text-xs font-semibold">Cargando notificaciones...</span>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-1">
                <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-700">No tienes notificaciones</p>
                <p className="text-xs text-gray-400">Te avisaremos cuando haya actividad académica en tus foros.</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.idNotificacion}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 transition-all flex items-start gap-3 cursor-pointer ${
                    n.leida ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/70 font-medium'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-gray-100 shrink-0 mt-0.5">
                    {getNotifIcon(n.tipo)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{n.titulo}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.mensaje}</p>
                  </div>

                  {!n.leida && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" title="No leída" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pie del Popover */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400 font-semibold">
              Prolecom · Notificaciones Académicas en tiempo real
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacionesDropdown;
