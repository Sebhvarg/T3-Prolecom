import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import { BookOpen, Code2, TrendingUp, HelpCircle, ChevronDown, ChevronUp, ListTodo, ArrowRight, CheckCircle2 } from 'lucide-react';

const CircularProgress = ({ porcentaje = 0, size = 52, color = '#0f2027' }) => {
  const radio = (size - 8) / 2;
  const circunf = 2 * Math.PI * radio;
  const offset = circunf - (porcentaje / 100) * circunf;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radio}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radio}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circunf}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

const LinearBar = ({ porcentaje = 0, color = 'bg-slate-900' }) => (
  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
    <div
      className={`h-2 rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${porcentaje}%` }}
    />
  </div>
);

const CourseProgressBar = ({ idCurso, progreso: progresoProp, onNavigateTab, onSelectMaterial }) => {
  const [progresoData, setProgresoData] = useState(null);
  const [loading, setLoading] = useState(Boolean(idCurso) && !progresoProp);
  const [error, setError] = useState('');
  const [showPendientes, setShowPendientes] = useState(false);
  const navigate = useNavigate();

  const progreso = progresoProp || progresoData;

  useEffect(() => {
    if (!idCurso || progresoProp) return;

    let isMounted = true;
    const fetchProgreso = async () => {
      try {
        const data = await authService.apiFetch(`/cursos/${idCurso}/progreso`);
        if (isMounted) {
          setProgresoData(data);
        }
      } catch (err) {
        console.error('Error cargando progreso:', err);
        if (isMounted) {
          setError('No se pudo cargar el progreso.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProgreso();

    return () => {
      isMounted = false;
    };
  }, [idCurso, progresoProp]);

  if (loading && !progreso) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
        <div className="h-3 bg-slate-100 rounded w-full" />
      </div>
    );
  }

  if (error && !progreso) return null;

  const progreso_total = Math.round(progreso?.progreso_total ?? progreso?.porcentaje ?? 0);
  const desafios = progreso?.desafios ?? {
    completados: progreso?.resueltos ?? 0,
    total: progreso?.totales ?? 0,
    porcentaje: progreso?.porcentaje ?? 0,
  };
  const materiales = progreso?.materiales ?? {
    vistos: 0,
    total: 0,
    porcentaje: 0,
  };
  const quizzes = progreso?.quizzes ?? {
    completados: 0,
    total: 0,
    porcentaje: 0,
  };
  const pendientes = progreso?.pendientes || [];

  const getColorTotal = (pct) => {
    if (pct >= 80) return '#059669';
    if (pct >= 50) return '#0f2027';
    if (pct >= 25) return '#d97706';
    return '#475569';
  };

  const colorTotal = getColorTotal(progreso_total);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/60">
            <TrendingUp size={16} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Mi Progreso en el Curso</h3>
        </div>
        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-lg shadow-2xs">
          {progreso_total}% Completado
        </span>
      </div>

      {/* Grid Horizontal Compacto */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Lado Izquierdo: Círculo y Mensaje */}
        <div className="md:col-span-4 flex items-center gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <div className="relative shrink-0">
            <CircularProgress porcentaje={progreso_total} size={52} color={colorTotal} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-800">{progreso_total}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Estado General</p>
            <p className="text-[11px] text-slate-500 font-normal leading-snug">
              {progreso_total < 25 && 'Estás comenzando, ¡sigue adelante!'}
              {progreso_total >= 25 && progreso_total < 50 && '¡Buen inicio! Tienes una base sólida.'}
              {progreso_total >= 50 && progreso_total < 80 && '¡Excelente! Vas a más de la mitad.'}
              {progreso_total >= 80 && progreso_total < 100 && '¡Casi terminas! Un último esfuerzo.'}
              {progreso_total === 100 && '🎉 ¡Curso completado con éxito!'}
            </p>
          </div>
        </div>

        {/* Lado Derecho: Desafíos, Materiales y Quizzes */}
        <div className="md:col-span-8 space-y-2.5">
          {/* Desafíos */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Code2 size={14} className="text-slate-600 shrink-0" />
                <span>Desafíos superados</span>
              </div>
              <span className="font-semibold text-slate-800">
                {desafios.completados} / {desafios.total} <span className="text-slate-400 font-normal text-[11px]">({desafios.porcentaje}%)</span>
              </span>
            </div>
            <LinearBar porcentaje={desafios.porcentaje} color="bg-slate-800" />
          </div>

          {/* Materiales */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <BookOpen size={14} className="text-slate-600 shrink-0" />
                <span>Materiales vistos</span>
              </div>
              <span className="font-semibold text-slate-800">
                {materiales.vistos} / {materiales.total} <span className="text-slate-400 font-normal text-[11px]">({materiales.porcentaje}%)</span>
              </span>
            </div>
            <LinearBar porcentaje={materiales.porcentaje} color="bg-slate-600" />
          </div>

          {/* Quizzes */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <HelpCircle size={14} className="text-slate-600 shrink-0" />
                <span>Evaluaciones / Quizzes</span>
              </div>
              <span className="font-semibold text-slate-800">
                {quizzes.completados} / {quizzes.total} <span className="text-slate-400 font-normal text-[11px]">({quizzes.porcentaje}%)</span>
              </span>
            </div>
            <LinearBar porcentaje={quizzes.porcentaje} color="bg-zinc-600" />
          </div>
        </div>
      </div>

      {/* Sección Desplegable de Ítems Pendientes */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowPendientes(!showPendientes)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200/60"
        >
          <div className="flex items-center gap-2">
            <ListTodo size={15} className="text-slate-600" />
            <span>Actividades Pendientes por Hacer</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
              pendientes.length > 0 ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {pendientes.length > 0 ? `${pendientes.length} pendientes` : '¡Todo al día!'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-normal text-xs">
            <span>{showPendientes ? 'Ocultar' : 'Ver lo que falta'}</span>
            {showPendientes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {showPendientes && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
            {pendientes.length === 0 ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-center text-xs font-medium text-emerald-900 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>¡Felicidades! Has completado todas las actividades y evaluaciones del curso.</span>
              </div>
            ) : (
              pendientes.map((item, idx) => {
                const isDesafio = item.tipo === 'desafio';
                const isQuiz = item.tipo === 'quiz';
                const isMaterial = item.tipo === 'material';

                let icon = <BookOpen size={14} className="text-slate-600" />;
                let btnText = 'Ver Material';
                let btnClass = 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200';

                if (isDesafio) {
                  icon = <Code2 size={14} className="text-amber-700" />;
                  btnText = 'Resolver Desafío';
                  btnClass = 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs';
                } else if (isQuiz) {
                  icon = <HelpCircle size={14} className="text-indigo-700" />;
                  btnText = 'Rendir Quiz';
                  btnClass = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs';
                }

                const handleItemClick = () => {
                  if (isDesafio) {
                    navigate(`/cursos/${idCurso}/desafios/${item.id}`);
                  } else if (isQuiz) {
                    if (onNavigateTab) {
                      onNavigateTab('quizzes');
                    } else {
                      navigate(`/cursos/${idCurso}?tab=quizzes`);
                    }
                  } else if (isMaterial) {
                    if (onSelectMaterial) {
                      onSelectMaterial(item.id);
                    } else {
                      navigate(`/cursos/${idCurso}?materialId=${item.id}`);
                    }
                  }
                };

                return (
                  <div
                    key={`${item.tipo}-${item.id}-${idx}`}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-900 truncate">{item.titulo}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span className="uppercase font-semibold tracking-wider">{item.etiqueta}</span>
                          <span>·</span>
                          <span>{item.detalle}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleItemClick}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${btnClass}`}
                    >
                      <span>{btnText}</span>
                      <ArrowRight size={13} />
                    </button>
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

export default CourseProgressBar;