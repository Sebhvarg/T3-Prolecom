/**
 * PasswordValidator.jsx
 * Componente reutilizable de validación de contraseña segura.
 * Uso: formulario de cambio de contraseña y registro de nuevos usuarios.
 *
 * Props:
 *   password  {string}  valor actual del campo contraseña nueva
 *   userData  {object}  { nombreCompleto, usuario, email, fechaDeNacimiento }
 *   onChange  {fn}      callback cuando cambia el input
 *   onValid   {fn}      callback(isValid: bool) para que el padre sepa si puede enviar
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Compilada una sola vez al cargar el módulo.
// Las alternativas más largas van primero para que el motor las evalúe antes
// que sus prefijos (ej. '12345678' antes que '1234567' antes que '123456').
const COMMON_SEQUENCES_RE = /123456789|12345678|1234567|123456|qwerty123|qwerty|asdfgh|zxcvbn|abcdef|contraseña|password|letmein|welcome|admin/i;

const checkRules = (pwd) => [
  {
    key:   'noSpaces',
    label: 'Sin espacios en blanco',
    pass:  pwd === pwd.trim() && !pwd.includes(' '),
  },
  {
    key:   'minLength',
    label: 'Mínimo 8 caracteres',
    pass:  pwd.length >= 8,
  },
  {
    key:   'hasUppercase',
    label: 'Al menos una mayúscula',
    pass:  /[A-Z]/.test(pwd),
  },
  {
    key:   'hasLowercase',
    label: 'Al menos una minúscula',
    pass:  /[a-z]/.test(pwd),
  },
  {
    key:   'hasNumber',
    label: 'Al menos un número',
    pass:  /\d/.test(pwd),
  },
  {
    key:   'hasSpecial',
    label: 'Al menos un carácter especial ($@!#%*_~^&)',
    pass:  /[$@!#%*_~^&+\-/\\]/.test(pwd),
  },
  {
    key:   'noCommon',
    label: 'Sin secuencias comunes (123456, qwerty…)',
    pass:  !COMMON_SEQUENCES_RE.test(pwd),
  },
];

const checkPersonalData = (pwd, userData) => {
  if (!userData) return false;
  const fragments = [
    ...(userData.nombreCompleto?.toLowerCase().split(' ') || []),
    userData.usuario?.toLowerCase(),
    userData.email?.split('@')[0]?.toLowerCase(),
    userData.fechaDeNacimiento?.replaceAll('-', ''),
  ].filter(f => f && f.length > 2);

  const pwdLower = pwd.toLowerCase();
  return fragments.some(f => pwdLower.includes(f));
};

const getStrengthMetrics = (passedCount, totalCount) => {
  const pct = Math.round((passedCount / totalCount) * 100);
  let color = 'bg-red-500';
  let label = 'Débil';

  if (pct > 33 && pct <= 66) {
    color = 'bg-yellow-400';
    label = 'Regular';
  } else if (pct > 66 && pct < 100) {
    color = 'bg-blue-400';
    label = 'Buena';
  } else if (pct === 100) {
    color = 'bg-green-500';
    label = 'Segura';
  }

  return { pct, color, label };
};

const PasswordValidator = ({ password = '', userData = {}, onChange, onValid }) => {
  const [touched, setTouched]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const pwd = password;
  const rules = checkRules(pwd);
  const allRequiredPass = rules.every(r => r.pass);
  const hasPersonalData = checkPersonalData(pwd, userData);

  const passedCount  = rules.filter(r => r.pass).length;
  const { pct: strengthPct, color: strengthColor, label: strengthLabel } = getStrengthMetrics(passedCount, rules.length);

  // Sugerencias opcionales de longitud
  const isStrong     = pwd.length >= 14;
  const isVeryStrong = pwd.length >= 16;

  useEffect(() => {
    onValid?.(allRequiredPass);
  }, [allRequiredPass, onValid]);

  let inputBorderClass = 'border-gray-300 focus:ring-[#2c5364]';
  if (touched) {
    if (allRequiredPass) {
      inputBorderClass = 'border-green-400 focus:ring-green-300';
    } else {
      inputBorderClass = 'border-red-400 focus:ring-red-300';
    }
  }

  let lengthClass = 'text-gray-400';
  let lengthText = 'Recomendado: superar 14 caracteres para mayor seguridad (opcional)';
  if (isVeryStrong) {
    lengthClass = 'text-green-600';
    lengthText = 'Excelente: más de 16 caracteres (máxima resistencia a fuerza bruta)';
  } else if (isStrong) {
    lengthClass = 'text-blue-500';
    lengthText = 'Bien: más de 14 caracteres (alta seguridad)';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="password_nuevo" className="text-sm font-semibold text-gray-700">
        Nueva contraseña <span className="text-red-500">*</span>
      </label>

      {/* Input con toggle de visibilidad */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id="password_nuevo"
          className={`w-full p-3 pr-12 rounded-xl border focus:outline-none focus:ring-2 text-gray-800 transition-colors ${inputBorderClass}`}
          placeholder="Ingresa tu nueva contraseña"
          value={password}
          onChange={e => { setTouched(true); onChange?.(e.target.value); }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(p => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7a9.77 9.77 0 012.168-3.532M6.343 6.343A9.77 9.77 0 0112 5c5 0 9 4 9 7a9.77 9.77 0 01-2.343 3.532M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Barra de fortaleza */}
      {touched && pwd.length > 0 && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Fortaleza</span>
            <span className="font-semibold">{strengthLabel}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`}
              style={{ width: `${strengthPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de reglas */}
      {touched && pwd.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {rules.map(rule => (
            <li key={rule.key} className={`flex items-center gap-2 ${rule.pass ? 'text-green-600' : 'text-red-500'}`}>
              <span className="font-bold">{rule.pass ? '✓' : '✗'}</span>
              <span>{rule.label}</span>
            </li>
          ))}

          {/* Advertencia datos personales */}
          {hasPersonalData && (
            <li className="flex items-center gap-2 text-yellow-600">
              <span className="font-bold">⚠</span>
              <span>Tu contraseña parece contener datos personales. Te recomendamos cambiarla.</span>
            </li>
          )}

          {/* Sugerencia opcional de longitud */}
          <li className={`flex items-center gap-2 ${lengthClass}`}>
            <span className="font-bold">{isVeryStrong || isStrong ? '✓' : '○'}</span>
            <span>{lengthText}</span>
          </li>
        </ul>
      )}

      {/* Confirmación visual */}
      {touched && allRequiredPass && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold mt-1">
          <span>✓</span>
          <span>¡Contraseña aceptada!</span>
        </div>
      )}
    </div>
  );
};

PasswordValidator.propTypes = {
  password: PropTypes.string,
  userData: PropTypes.shape({
    nombreCompleto: PropTypes.string,
    usuario: PropTypes.string,
    email: PropTypes.string,
    fechaDeNacimiento: PropTypes.string,
  }),
  onChange: PropTypes.func,
  onValid: PropTypes.func,
};

export default PasswordValidator;