import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2, Edit3, Search, Users as UsersIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import userService, { type UserDependencies } from '../api/user.service';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import authService from '../api/auth.service';

interface UserData {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [userDependencies, setUserDependencies] = useState<UserDependencies | null>(null);
  const [transferToId, setTransferToId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUser = authService.getCurrentUser();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setUserDependencies(null);
    setTransferToId('');
  };

  const handleDeleteClick = async (user: UserData) => {
    if (currentUser?.id && user.id === currentUser.id) {
      setError('You cannot delete your own account.');
      return;
    }

    try {
      const dependencies = await userService.getUserDependencies(user.id);
      setUserDependencies(dependencies);
      setUserToDelete(user);
      setTransferToId(dependencies.hasDependencies ? '' : 'none');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user dependency info');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !userDependencies) return;

    if (userDependencies.hasDependencies && !transferToId) {
      setError('Please select a successor for linked records.');
      return;
    }

    setIsDeleting(true);
    try {
      const finalTransferId = userDependencies.hasDependencies ? parseInt(transferToId, 10) : undefined;
      await userService.deleteUser(userToDelete.id, finalTransferId);
      await fetchUsers();
      closeDeleteModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse text-xs uppercase tracking-widest">Syncing directory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Users Management</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Managing {users.length} active system nodes.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 font-bold text-xs uppercase tracking-wider"
        >
          <Plus size={18} />
          Create New User
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by identity or email..."
            className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0" />
          {error}
          <button className="ml-auto uppercase text-[10px]" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700">{user.fullName}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-xs font-black uppercase text-indigo-600">{user.role}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={currentUser?.id === user.id}
                        className={`p-2 transition-all ${currentUser?.id === user.id ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {userToDelete && userDependencies && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDeleteModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${userDependencies.hasDependencies ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                  {userDependencies.hasDependencies ? <UsersIcon size={32} /> : <AlertCircle size={32} />}
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  {userDependencies.hasDependencies ? 'Transfer Ownership' : 'Confirm Deletion'}
                </h3>

                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  {userDependencies.hasDependencies
                    ? <><span className="text-slate-900 font-bold">{userToDelete.fullName}</span> has <span className="text-amber-600 font-bold">{userDependencies.totalDependencies} linked records</span> (tasks/comments/activity). Transfer is required before deletion.</>
                    : <>Are you sure you want to remove <span className="text-slate-900 font-bold">{userToDelete.fullName}</span>? This action is permanent.</>
                  }
                </p>

                {userDependencies.hasDependencies && (
                  <div className="w-full space-y-2 mb-8 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Select Successor:</label>
                    <div className="relative">
                      <select
                        value={transferToId === 'none' ? '' : transferToId}
                        onChange={(e) => setTransferToId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-12 py-4 text-sm font-bold appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Choose a team member...</option>
                        {users.filter((u) => u.id !== userToDelete.id).map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <button onClick={closeDeleteModal} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting || (userDependencies.hasDependencies && !transferToId)}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-200 disabled:bg-slate-300 transition-all"
                  >
                    {isDeleting ? 'Processing...' : userDependencies.hasDependencies ? 'Transfer & Delete' : 'Delete User'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onUserCreated={fetchUsers} />
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => setIsEditModalOpen(false)}
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
};

export default Users;
