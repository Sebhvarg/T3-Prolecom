import { Link } from 'react-router-dom';
import AuthHero from '../components/auth/AuthHero';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans">
      <AuthHero />

      {/* Lado derecho - Formulario */}
      <div className="flex-1 bg-white flex justify-center items-center p-8 overflow-y-auto">
        <div className="w-full max-w-[400px] py-8">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl text-[#111] mb-2 font-semibold">Registrarse</h1>
            <p className="text-[#666] text-base">Crea tu cuenta de profesor o estudiante para comenzar</p>
          </div>

          <RegisterForm />

          <div className="mt-8 text-center text-[#666] text-sm">
            ¿Ya tienes cuenta? {' '}
            <Link to="/login" className="text-[#2c5364] font-bold hover:underline">INICIA SESIÓN</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
