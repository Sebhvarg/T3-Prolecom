import { useState, useEffect } from 'react';
import { adminService } from '../../api/adminService';
import { Search, Filter, Shield, Key, CheckCircle, AlertTriangle, UserCheck, UserX } from 'lucide-react';

const UserManagementTable = () => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [toast, setToast] = useState(null);

  // Modales
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState('');

  const [stateModalUser, setStateModalUser] = useState(null);
  const [newStateId, setNewStateId] = useState('');

  const [passModalUser, setPassModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedRole) params.rol = selectedRole;
      if (selectedState) params.estado = selectedState;

      const res = await adminService.getUsers(params);
      setUsers(res.users || []);
      if (res.availableRoles) setAvailableRoles(res.availableRoles);
      if (res.availableStates) setAvailableStates(res.availableStates);
    } catch (err) {
      showToast(err.message || 'Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedState]);

  // Cambiar Rol
  const handleUpdateRole = async () => {
    if (!roleModalUser || !newRoleId) return;
    try {
      await adminService.updateUserRole(roleModalUser.idUsuario, newRoleId);
      showToast(`Rol de ${roleModalUser.nombreCompleto} actualizado correctamente.`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Error al actualizar rol', 'error');
    }
  };

  // Cambiar Estado / Deshabilitar
  const handleUpdateState = async () => {
    if (!stateModalUser || !newStateId) return;
    try {
      await adminService.updateUserEstado(stateModalUser.idUsuario, newStateId);
      showToast(`Estado de ${stateModalUser.nombreCompleto} actualizado correctamente.`);
      setStateModalUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // Resetear Contraseña
  const handleResetPassword = async () => {
    if (!passModalUser) return;
    if (!newPassword || newPassword.length < 8) {
      setPassError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      await adminService.resetUserPassword(passModalUser.idUsuario, newPassword);
      showToast(`Contraseña de ${passModalUser.nombreCompleto} restablecida con éxito.`);
      setPassModalUser(null);
      setNewPassword('');
      setPassError('');
    } catch (err) {
      setPassError(err.message || 'Error al restablecer la contraseña.');
    }
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'Administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Soporte':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Profesor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Moderador':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ayudante':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStateBadge = (stateName) => {
    switch (stateName) {
      case 'Activo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Suspendido':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baneado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-lg flex items-center justify-between transition-all ${
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span className="font-medium">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-sm font-semibold hover:underline">Cerrar</button>
        </div>
      )}

      {/* Controles de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los Roles</option>
              {availableRoles.map((r) => (
                <option key={r.idRol} value={r.rol}>{r.rol}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            {availableStates.map((s) => (
              <option key={s.idEstado} value={s.estado}>{s.estado}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Cargando cuentas de usuarios...</div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No se encontraron usuarios registrados con estos filtros.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones de Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {users.map((u) => {
                const userRole = u.roles?.[0]?.rol || 'Sin Rol';
                const userState = u.estado?.estado || 'Activo';

                return (
                  <tr key={u.idUsuario} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      <div>{u.nombreCompleto}</div>
                      <div className="text-xs text-gray-500">@{u.usuario}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(userRole)}`}>
                        {userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStateBadge(userState)}`}>
                        {userState}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        title="Cambiar Rol"
                        onClick={() => {
                          setRoleModalUser(u);
                          setNewRoleId(u.roles?.[0]?.idRol || '');
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 border border-blue-200 text-xs font-medium"
                      >
                        <Shield size={14} /> Rol
                      </button>

                      <button
                        title="Cambiar Estado / Deshabilitar"
                        onClick={() => {
                          setStateModalUser(u);
                          setNewStateId(u.idEstado || 1);
                        }}
                        className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 border text-xs font-medium ${
                          userState === 'Activo'
                            ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                            : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {userState === 'Activo' ? <UserX size={14} /> : <UserCheck size={14} />} Estado
                      </button>

                      <button
                        title="Resetear Contraseña"
                        onClick={() => {
                          setPassModalUser(u);
                          setNewPassword('');
                          setPassError('');
                        }}
                        className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Key size={14} /> Pass
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cambiar Rol */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Shield className="text-blue-600" size={20} /> Cambiar Rol de Usuario
            </h3>
            <p className="text-sm text-gray-600">
              Selecciona el nuevo rol para <strong>{roleModalUser.nombreCompleto}</strong> (@{roleModalUser.usuario}):
            </p>
            <select
              value={newRoleId}
              onChange={(e) => setNewRoleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un rol</option>
              {availableRoles.map((r) => (
                <option key={r.idRol} value={r.idRol}>{r.rol}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Guardar Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {stateModalUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UserX className="text-amber-600" size={20} /> Cambiar Estado de Cuenta
            </h3>
            <p className="text-sm text-gray-600">
              Modifica el estado de acceso de <strong>{stateModalUser.nombreCompleto}</strong>:
            </p>
            <select
              value={newStateId}
              onChange={(e) => setNewStateId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableStates.map((s) => (
                <option key={s.idEstado} value={s.idEstado}>{s.estado}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStateModalUser(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateState}
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium"
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resetear Contraseña */}
      {passModalUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Key className="text-purple-600" size={20} /> Restablecer Contraseña
            </h3>
            <p className="text-sm text-gray-600">
              Establece una nueva contraseña para <strong>{passModalUser.nombreCompleto}</strong>:
            </p>

            {passError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                {passError}
              </div>
            )}

            <input
              type="password"
              placeholder="Nueva contraseña (mínimo 8 caracteres)..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPassModalUser(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Restablecer Contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
