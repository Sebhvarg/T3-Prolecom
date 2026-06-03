import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/estudiante/StudentDashboard';

const ModeradorDashboard = () => <h1>Panel de Moderador</h1>;
const ProfesorDashboard = () => <h1>Panel de Profesor</h1>;
const AyudanteDashboard = () => <h1>Panel de Ayudante</h1>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas */}
          <Route element={<PrivateRoute allowedRoles={[1]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          <Route element={<PrivateRoute allowedRoles={[2]} />}>
            <Route path="/moderador/dashboard" element={<ModeradorDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[3]} />}>
            <Route path="/profesor/dashboard" element={<ProfesorDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[4]} />}>
            <Route path="/soporte/dashboard" element={<h1>Panel de Soporte</h1>} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[5]} />}>
            <Route path="/ayudante/dashboard" element={<AyudanteDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={[6]} />}>
            <Route path="/dashboard/estudiante" element={<StudentDashboard />} />
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

