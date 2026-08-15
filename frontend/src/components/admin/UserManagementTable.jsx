import { useState, useEffect, useCallback } from 'react';
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

  const fetchUsers = useCallback(async () => {
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
  }, [search, selectedRole, selectedState]);

  useEffect(() => {
    let isMounted = true;
    const params = {};
    if (search) params.search = search;
    if (selectedRole) params.rol = selectedRole;
    if (selectedState) params.estado = selectedState;

    adminService
      .getUsers(params)
      .then((res) => {
        if (isMounted) {
          setUsers(res.users || []);
          if (res.availableRoles) setAvailableRoles(res.availableRoles);
          if (res.availableStates) setAvailableStates(res.availableStates);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast(err.message || 'Error al cargar usuarios', 'error');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
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
        return 'bg-slate-100 text-slate-800 border-slate-300 font-semibold';
      case 'Soporte':
        return 'bg-sky-50 text-sky-800 border-sky-200/80 font-medium';
      case 'Profesor':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/80 font-medium';
      case 'Moderador':
        return 'bg-amber-50 text-amber-900 border-amber-200/80 font-medium';
      case 'Ayudante':
        return 'bg-teal-50 text-teal-800 border-teal-200/80 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStateBadge = (stateName) => {
    switch (stateName) {
      case 'Activo':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium';
      case 'Inactivo':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Suspendido':
        return 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium';
      case 'Baneado':
        return 'bg-rose-50 text-rose-800 border-rose-200/80 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between transition-all ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {toast.type === 'error' ? <AlertTriangle size={18} className="text-rose-600" /> : <CheckCircle size={18} className="text-emerald-600" />}
            <span>{toast.message}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-xs font-semibold hover:underline text-slate-700">Cerrar</button>
        </div>
      )}

      {/* Controles de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-700 cursor-pointer"
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
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-700 cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            {availableStates.map((s) => (
              <option key={s.idEstado} value={s.estado}>{s.estado}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios con Zebra Striping */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Cargando cuentas de usuarios...</div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">No se encontraron usuarios registrados con estos filtros.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0f2027] text-white font-semibold uppercase tracking-wider border-b border-[#1e3a47] text-[11px]">
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones de Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, index) => {
                const userRole = u.roles?.[0]?.rol || 'Sin Rol';
                const userState = u.estado?.estado || 'Activo';
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={u.idUsuario}
                    className={`transition-colors ${
                      isEven ? 'bg-white' : 'bg-slate-50/75'
                    } hover:bg-slate-100/70 border-b border-slate-100`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{u.nombreCompleto}</div>
                      <div className="text-[11px] font-normal text-slate-500">@{u.usuario}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] border ${getRoleBadge(userRole)}`}>
                        {userRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] border ${getStateBadge(userState)}`}>
                        {userState}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        title="Cambiar Rol"
                        onClick={() => {
                          setRoleModalUser(u);
                          setNewRoleId(u.roles?.[0]?.idRol || '');
                        }}
                        className="px-2.5 py-1.5 text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <Shield size={13} className="text-slate-500" /> Rol
                      </button>

                      <button
                        type="button"
                        title="Cambiar Estado / Deshabilitar"
                        onClick={() => {
                          setStateModalUser(u);
                          setNewStateId(u.idEstado || 1);
                        }}
                        className="px-2.5 py-1.5 text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        {userState === 'Activo' ? <UserX size={13} className="text-amber-600" /> : <UserCheck size={13} className="text-emerald-600" />} Estado
                      </button>

                      <button
                        type="button"
                        title="Resetear Contraseña"
                        onClick={() => {
                          setPassModalUser(u);
                          setNewPassword('');
                          setPassError('');
                        }}
                        className="px-2.5 py-1.5 text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <Key size={13} className="text-slate-500" /> Pass
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="text-slate-700" size={18} /> Cambiar Rol de Usuario
            </h3>
            <p className="text-xs text-slate-600">
              Selecciona el nuevo rol para <strong>{roleModalUser.nombreCompleto}</strong> (@{roleModalUser.usuario}):
            </p>
            <select
              value={newRoleId}
              onChange={(e) => setNewRoleId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
            >
              <option value="">Selecciona un rol</option>
              {availableRoles.map((r) => (
                <option key={r.idRol} value={r.idRol}>{r.rol}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Guardar Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {stateModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserX className="text-slate-700" size={18} /> Cambiar Estado de Cuenta
            </h3>
            <p className="text-xs text-slate-600">
              Modifica el estado de acceso de <strong>{stateModalUser.nombreCompleto}</strong>:
            </p>
            <select
              value={newStateId}
              onChange={(e) => setNewStateId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
            >
              {availableStates.map((s) => (
                <option key={s.idEstado} value={s.idEstado}>{s.estado}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStateModalUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateState}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resetear Contraseña */}
      {passModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="text-slate-700" size={18} /> Restablecer Contraseña
            </h3>
            <p className="text-xs text-slate-600">
              Establece una nueva contraseña para <strong>{passModalUser.nombreCompleto}</strong>:
            </p>

            {passError && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {passError}
              </div>
            )}

            <input
              type="password"
              placeholder="Nueva contraseña (mínimo 8 caracteres)..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPassModalUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
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
