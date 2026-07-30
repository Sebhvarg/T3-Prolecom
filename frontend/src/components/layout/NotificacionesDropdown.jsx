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
    let ignore = false;
    async function load() {
      try {
        const res = await notificacionesService.getNotificaciones(1);
        if (!ignore) {
          const list = res.data || [];
          setNotificaciones(list);
          const unread = list.filter((n) => !n.leida).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Error al cargar notificaciones:', err);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

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
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setLoading(true);
      fetchNotificaciones().finally(() => setLoading(false));
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar notificaciones leídas:', err);
    }
  };

  const handleNotificationClick = async (notificacion) => {
    if (!notificacion.leida) {
      try {
        await notificacionesService.marcarLeida(notificacion.idNotificacion);
        setNotificaciones((prev) =>
          prev.map((n) => (n.idNotificacion === notificacion.idNotificacion ? { ...n, leida: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error al marcar leída:', err);
      }
    }

    setIsOpen(false);

    // Parsear payload para navegar dinámicamente al foro/pregunta
    let payload = {};
    if (typeof notificacion.payload === 'string') {
      try {
        payload = JSON.parse(notificacion.payload);
      } catch {
        payload = {};
      }
    } else if (notificacion.payload) {
      payload = notificacion.payload;
    }

    if (payload.idCurso && payload.idForo) {
      let targetUrl = `/cursos/${payload.idCurso}?foroId=${payload.idForo}`;
      if (payload.idPregunta) {
        targetUrl += `&preguntaId=${payload.idPregunta}`;
      }
      navigate(targetUrl);
    }
  };

  const getNotifIcon = (tipo) => {
    switch (tipo) {
      case 'respuesta_pregunta':
        return <MessageSquare size={16} className="text-[#2c5364]" />;
      case 'respuesta_validada':
        return <CheckCircle2 size={16} className="text-[#0f766e]" />;
      case 'reporte_contenido':
        return <ShieldAlert size={16} className="text-amber-600" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  let dropdownContent;
  if (loading) {
    dropdownContent = (
      <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-[#2c5364]" />
        <span className="text-xs font-semibold">Cargando notificaciones...</span>
      </div>
    );
  } else if (notificaciones.length === 0) {
    dropdownContent = (
      <div className="p-8 text-center text-gray-400 space-y-1">
        <Bell className="w-8 h-8 text-gray-300 mx-auto" />
        <p className="text-sm font-bold text-gray-700">No tienes notificaciones</p>
        <p className="text-xs text-gray-400">Te avisaremos cuando haya actividad académica en tus foros.</p>
      </div>
    );
  } else {
    dropdownContent = notificaciones.map((n) => (
      <button
        key={n.idNotificacion}
        type="button"
        onClick={() => handleNotificationClick(n)}
        className={`w-full text-left p-4 transition-all flex items-start gap-3 cursor-pointer ${
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
      </button>
    ));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de la campanita en el Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-[#2c5364] hover:bg-gray-100/70 rounded-full transition-all cursor-pointer focus:outline-none"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
          {/* Header del Dropdown */}
          <div className="p-4 bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <h3 className="font-bold text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodasLeidas}
                className="text-xs text-white/80 hover:text-white flex items-center gap-1 font-semibold transition cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>Marcar todas leídas</span>
              </button>
            )}
          </div>

          {/* Cuerpo - Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {dropdownContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacionesDropdown;
