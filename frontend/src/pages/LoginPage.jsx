import { Link } from 'react-router-dom';
import AuthHero from '../components/auth/AuthHero';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {

  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans">
      <AuthHero />

      {/* Lado derecho - Formulario */}
      <div className="flex-1 bg-white flex justify-center items-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl text-[#111] mb-2 font-semibold">Iniciar Sesión</h1>
            <p className="text-[#666] text-base">Ingresa tus credenciales para acceder a la plataforma</p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center text-[#666] text-sm">
            No tienes cuenta? {' '}
            <Link to="/register" className="text-[#2c5364] font-bold hover:underline">REGISTRATE</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

