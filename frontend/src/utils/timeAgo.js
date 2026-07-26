const TIME_UNITS = [
  { maxSeconds: 60, divisor: 1, label: () => 'hace unos segundos' },
  { maxSeconds: 3600, divisor: 60, label: (m) => `hace ${m} min${m > 1 ? 's' : ''}` },
  { maxSeconds: 86400, divisor: 3600, label: (h) => `hace ${h} hr${h > 1 ? 's' : ''}` },
  { maxSeconds: 172800, divisor: 86400, label: () => 'ayer' },
  { maxSeconds: 604800, divisor: 86400, label: (d) => `hace ${d} días` },
  { maxSeconds: 2592000, divisor: 604800, label: (w) => `hace ${w} sem${w > 1 ? 'anas' : 'ana'}` },
  { maxSeconds: 31536000, divisor: 2592000, label: (m) => `hace ${m} mes${m > 1 ? 'es' : ''}` },
];

/**
 * Convierte un timestamp ISO o Date en una cadena de tiempo relativo en español.
 */
export function timeAgo(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const secondsPast = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondsPast <= 0) {
    return 'hace un momento';
  }

  const unit = TIME_UNITS.find((item) => secondsPast < item.maxSeconds);
  if (unit) {
    const qty = Math.floor(secondsPast / unit.divisor);
    return unit.label(qty);
  }

  const yearsPast = Math.floor(secondsPast / 31536000);
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
