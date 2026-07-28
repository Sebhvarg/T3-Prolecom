/**
 * SCRUM-51 - Frontend (ReactJS): Visualización del progreso del curso
 * Muestra barras de progreso y porcentajes circulares para:
 * - Progreso total del curso
 * - Desafíos completados
 * - Materiales vistos
 */

import { useEffect, useState } from 'react';
import { authService } from '../../api/authService';
import { BookOpen, Code2, TrendingUp } from 'lucide-react';

// ── Círculo SVG de progreso ───────────────────────────────────────────────
const CircularProgress = ({ porcentaje = 0, size = 80, color = '#2c5364' }) => {
  const radio     = (size - 10) / 2;
  const circunf   = 2 * Math.PI * radio;
  const offset    = circunf - (porcentaje / 100) * circunf;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Fondo gris */}
      <circle
        cx={size / 2} cy={size / 2} r={radio}
        fill="none" stroke="#e5e7eb" strokeWidth={8}
      />
      {/* Arco de progreso */}
      <circle
        cx={size / 2} cy={size / 2} r={radio}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circunf}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

// ── Barra de progreso lineal ──────────────────────────────────────────────
const LinearBar = ({ porcentaje = 0, color = 'bg-[#2c5364]' }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
    <div
      className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${porcentaje}%` }}
    />
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────
const CourseProgressBar = ({ idCurso }) => {
  const [progreso, setProgreso]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!idCurso) return;

    const fetchProgreso = async () => {
      setLoading(true);
      try {
        const data = await authService.apiFetch(`/cursos/${idCurso}/progreso`);
        setProgreso(data);
      } catch (err) {
        setError('No se pudo cargar el progreso.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgreso();
  }, [idCurso]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">
        {error}
      </div>
    );
  }

  if (!progreso) return null;

  const { progreso_total, desafios, materiales } = progreso;

  // Color del progreso total según nivel
  const getColorTotal = (pct) => {
    if (pct >= 80) return '#16a34a';
    if (pct >= 50) return '#2c5364';
    if (pct >= 25) return '#d97706';
    return '#dc2626';
  };

  const colorTotal = getColorTotal(progreso_total);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-[#2c5364]" />
        <h3 className="text-base font-bold text-gray-800">Mi Progreso</h3>
      </div>

      {/* Progreso total — círculo central */}
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <CircularProgress porcentaje={progreso_total} size={90} color={colorTotal} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-800">{progreso_total}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Progreso Total del Curso</p>
          <p className="text-xs text-gray-400 mt-1">
            {progreso_total < 25 && 'Estás comenzando, ¡sigue adelante!'}
            {progreso_total >= 25 && progreso_total < 50 && '¡Buen inicio! Ya tienes una base sólida.'}
            {progreso_total >= 50 && progreso_total < 80 && '¡Vas muy bien! Estás a más de la mitad.'}
            {progreso_total >= 80 && progreso_total < 100 && '¡Casi terminas! Un último esfuerzo.'}
            {progreso_total === 100 && '🎉 ¡Curso completado! Excelente trabajo.'}
          </p>
        </div>
      </div>

      {/* Separador */}
      <hr className="border-gray-100" />

      {/* Desafíos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Code2 size={16} className="text-[#2c5364]" />
            <span>Desafíos superados</span>
          </div>
          <span className="text-sm font-bold text-gray-800">
            {desafios.completados} / {desafios.total}
            <span className="text-gray-400 font-normal ml-1">({desafios.porcentaje}%)</span>
          </span>
        </div>
        <LinearBar porcentaje={desafios.porcentaje} color="bg-[#2c5364]" />
      </div>

      {/* Materiales */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <BookOpen size={16} className="text-amber-500" />
            <span>Materiales vistos</span>
          </div>
          <span className="text-sm font-bold text-gray-800">
            {materiales.vistos} / {materiales.total}
            <span className="text-gray-400 font-normal ml-1">({materiales.porcentaje}%)</span>
          </span>
        </div>
        <LinearBar porcentaje={materiales.porcentaje} color="bg-amber-400" />
      </div>

    </div>
  );
};

export default CourseProgressBar;