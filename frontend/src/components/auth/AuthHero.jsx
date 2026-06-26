import { Book, Target, Users } from 'lucide-react';
import logo from '../../assets/Logo/logoHorizontal.webp';

const AuthHero = () => {
  return (
    <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] flex-col justify-center items-center text-white p-8 relative">
      <div className="max-w-[450px] text-left">
        <div className="mb-10">
          <img src={logo} alt="PROLECOM Logo" className="max-w-[320px] h-auto" />
        </div>
        
        <h2 className="text-2xl mb-8 font-normal opacity-90">Pro Learning Community</h2>
        
        <div className="flex gap-6 text-xl font-medium items-center">
          <div className="flex items-center gap-2">
            <Book size={24} />
            <span>Cursos</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Target size={24} />
            <span>Desafíos</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Users size={24} />
            <span>Colaboración</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHero;
