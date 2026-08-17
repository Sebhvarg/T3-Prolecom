import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { notificacionesService } from '../api/notificacionesService';
import { authService } from '../api/authService';

/**
 * NotificacionContext — patrón Observer para notificaciones en tiempo real.
 *
 * Sujeto: servidor Laravel Reverb (WebSocket)
 * Observadores: cualquier componente que llame useNotificaciones()
 *
 * Al conectarse, carga las notificaciones existentes via REST y luego
 * se suscribe al canal privado `notificaciones.{idUsuario}` para recibir
 * nuevas en tiempo real sin polling.
 */
const NotificacionContext = createContext(null);

export const NotificacionProvider = ({ children }) => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [conectado, setConectado] = useState(false);
  const echoRef = useRef(null);
  const channelRef = useRef(null);

  // ── Carga inicial via REST ──────────────────────────────────────────────
  const cargarNotificaciones = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificacionesService.getNotificaciones();
      const items = data?.data ?? data ?? [];
      setNotificaciones(
        items.map((n) => ({
          id: n.idNotificacion,
          tipo: n.tipo,
          titulo: n.titulo,
          curso: n.mensaje,
          fecha: n.created_at
            ? new Date(n.created_at).toLocaleDateString('es-CO')
            : '',
          leida: n.leida,
        }))
      );
    } catch {
      // No crítico
    }
  }, [user]);

  // ── WebSocket: conectar a Reverb al montar ──────────────────────────────
  useEffect(() => {
    if (!user?.idUsuario) return;

    const token = authService.getToken();
    if (!token || token === 'TAMPERED') return;

    // Importación dinámica de Laravel Echo + Pusher-js
    // (se instalan como dependencias npm del frontend)
    let isMounted = true;

    const connectEcho = async () => {
      try {
        const [{ default: Echo }, { default: Pusher }] = await Promise.all([
          import('laravel-echo'),
          import('pusher-js'),
        ]);

        // Exponer Pusher globalmente (requerido por Echo)
        window.Pusher = Pusher;

        const echo = new Echo({
          broadcaster: 'reverb',
          key: import.meta.env.VITE_REVERB_APP_KEY || 'local-key',
          wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
          wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
          wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
          forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
          enabledTransports: ['ws', 'wss'],
          authEndpoint: `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        });

        if (!isMounted) {
          echo.disconnect();
          return;
        }

        echoRef.current = echo;

        // ── Suscripción al canal privado del usuario (OBSERVADOR) ──
        const channel = echo.private(`notificaciones.${user.idUsuario}`);
        channelRef.current = channel;

        channel
          .subscribed(() => {
            if (isMounted) setConectado(true);
          })
          .listen('.notificacion.nueva', (payload) => {
            if (!isMounted) return;
            // Agregar al principio de la lista (más reciente primero)
            setNotificaciones((prev) => [
              {
                id: payload.idNotificacion,
                tipo: payload.tipo,
                titulo: payload.titulo,
                curso: payload.mensaje,
                fecha: payload.created_at
                  ? new Date(payload.created_at).toLocaleDateString('es-CO')
                  : '',
                leida: false,
              },
              ...prev,
            ]);
          })
          .error((err) => {
            console.warn('[Notificaciones WS] Error de canal:', err);
            if (isMounted) setConectado(false);
          });
      } catch (err) {
        console.warn('[Notificaciones WS] No se pudo conectar:', err);
      }
    };

    cargarNotificaciones();
    connectEcho();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        echoRef.current?.leave(`notificaciones.${user.idUsuario}`);
        channelRef.current = null;
      }
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
      }
      setConectado(false);
    };
  }, [user?.idUsuario, cargarNotificaciones]);

  // ── Acciones ────────────────────────────────────────────────────────────
  const limpiar = useCallback(async () => {
    try {
      await notificacionesService.limpiarTodas();
      setNotificaciones([]);
    } catch {
      // Silencioso
    }
  }, []);

  const noLeidas = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const value = useMemo(
    () => ({ notificaciones, noLeidas, conectado, limpiar, cargarNotificaciones }),
    [notificaciones, noLeidas, conectado, limpiar, cargarNotificaciones]
  );

  return (
    <NotificacionContext.Provider value={value}>
      {children}
    </NotificacionContext.Provider>
  );
};

NotificacionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook público para componentes observadores
// eslint-disable-next-line react-refresh/only-export-components
export const useNotificaciones = () => {
  const ctx = useContext(NotificacionContext);
  if (!ctx) throw new Error('useNotificaciones debe usarse dentro de <NotificacionProvider>');
  return ctx;
};
