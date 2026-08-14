import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SoporteDashboard from './pages/soporte/SoporteDashboard';
import StudentDashboard from './pages/estudiante/StudentDashboard';
import ProfesorDashboard from './pages/profesor/ProfesorDashboard';
import CursosPage from './pages/cursos/CursosPage';
import CursoDetallePage from './pages/cursos/CursoDetallePage';
import DesafioDetallePage from './pages/cursos/DesafioDetallePage';
import PerfilPage from './pages/perfil/PerfilPage';

import ModeratorDashboard from './pages/dashboard/ModeratorDashboard';
import AyudanteDashboard from './pages/ayudante/AyudanteDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas protegidas */}
          <Route element={<PrivateRoute allowedRoles={[1, 4]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/soporte/dashboard" element={<SoporteDashboard />} />
          </Route>
          
          <Route element={<PrivateRoute allowedRoles={[1, 2]} />}>
            <Route path="/moderador/dashboard" element={<ModeratorDashboard />} />
            <Route path="/dashboard/moderador" element={<ModeratorDashboard />} />
            <Route path="/moderacion" element={<ModeratorDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[3]} />}>
            <Route path="/profesor/dashboard" element={<ProfesorDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[5]} />}>
            <Route path="/ayudante/dashboard" element={<AyudanteDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[6]} />}>
            <Route path="/dashboard/estudiante" element={<StudentDashboard />} />
          </Route>

          {/* Cursos y Desafíos — Accesible para todos los usuarios autenticados */}
          <Route element={<PrivateRoute allowedRoles={[1, 2, 3, 4, 5, 6]} />}>
            <Route path="/cursos" element={<CursosPage />} />
            <Route path="/cursos/:id" element={<CursoDetallePage />} />
            <Route path="/cursos/:id/desafios/:idDesafio" element={<DesafioDetallePage />} />
            <Route path="/desafios/:idDesafio" element={<DesafioDetallePage />} />
            <Route path="/desafios/:id" element={<DesafioDetallePage />} />
          </Route>

          {/* Perfil accesible para todos los roles autenticados */}
          <Route element={<PrivateRoute allowedRoles={[1, 2, 3, 4, 5, 6]} />}>
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

