/**
 * Convierte un timestamp ISO o Date en una cadena de tiempo relativo en español.
 * Ej: "hace 5 minutos", "hace 2 horas", "ayer", "hace 3 días".
 */
export function timeAgo(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const secondsPast = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsPast < 0) {
    return 'hace un momento';
  }

  if (secondsPast < 60) {
    return 'hace unos segundos';
  }

  const minutesPast = Math.floor(secondsPast / 60);
  if (minutesPast < 60) {
    return `hace ${minutesPast} min${minutesPast > 1 ? 's' : ''}`;
  }

  const hoursPast = Math.floor(minutesPast / 60);
  if (hoursPast < 24) {
    return `hace ${hoursPast} hr${hoursPast > 1 ? 's' : ''}`;
  }

  const daysPast = Math.floor(hoursPast / 24);
  if (daysPast === 1) {
    return 'ayer';
  }
  if (daysPast < 7) {
    return `hace ${daysPast} días`;
  }

  const weeksPast = Math.floor(daysPast / 7);
  if (weeksPast < 4) {
    return `hace ${weeksPast} sem${weeksPast > 1 ? 'anas' : 'ana'}`;
  }

  const monthsPast = Math.floor(daysPast / 30);
  if (monthsPast < 12) {
    return `hace ${monthsPast} mes${monthsPast > 1 ? 'es' : ''}`;
  }

  const yearsPast = Math.floor(daysPast / 365);
  return `hace ${yearsPast} año${yearsPast > 1 ? 's' : ''}`;
}

/**
 * Formatea una fecha en formato legible: "26 Jul 2026, 12:30"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
