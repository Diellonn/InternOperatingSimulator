import { useEffect, useState, useRef } from 'react';
import { Camera, KeyRound, Save, UserCircle2, Mail, User, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import profileService, { type IProfile } from '../api/profile.service';
import authService from '../api/auth.service';
import { getCachedProfilePhoto, setCachedProfilePhoto } from '../utils/profilePhotoCache';

const ProfileSettings = () => {
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileService.getMyProfile()
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setEmail(data.email);
        if (currentUser?.id) {
          setCachedProfilePhoto(currentUser.id, data.profilePhotoUrl || null);
        }
      })
      .catch((err: any) => setError(err.response?.data?.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsSaving(true);
    try {
      await profileService.updateMyProfile({ fullName, email });
      setSuccess('Profile information updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally { setIsSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword.trim()) {
      setError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await profileService.changePassword({ oldPassword, newPassword });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setSuccess('Security credentials updated.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors).flat()[0] as string | undefined;
        setError(firstError || 'Password change failed.');
      } else {
        setError(data?.message || 'Password change failed.');
      }
    } finally { setIsChangingPassword(false); }
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    
    // UI Preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const result = await profileService.uploadPhoto(file);
      setProfile(prev => prev ? { ...prev, profilePhotoUrl: result.profilePhotoUrl } : prev);
      if (currentUser?.id) {
        setCachedProfilePhoto(currentUser.id, result.profilePhotoUrl || null);
      }
      setSuccess('Photo uploaded successfully.');
    } catch (err: any) {
      setError('Photo upload failed.');
      setPhotoPreview(null);
    } finally { setIsUploadingPhoto(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  const avatarSrc: string | undefined =
    photoPreview ??
    profile?.profilePhotoUrl ??
    getCachedProfilePhoto(currentUser?.id) ??
    undefined;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 font-medium mt-2">Manage your professional identity and security preferences.</p>
      </div>

      {/* Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {error && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3">
            <ShieldCheck size={20} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3">
            <ShieldCheck size={20} /> {success}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 text-center shadow-sm">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden mb-6 mx-auto transition-transform group-hover:scale-105">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserCircle2 size={80} />
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-0 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all hover:rotate-12"
              >
                <Camera size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900">{fullName}</h2>
            <p className="text-slate-400 text-sm font-medium mb-4">{profile?.role || 'Team Member'}</p>
            <div className="pt-6 border-t border-slate-50 flex flex-col gap-2">
               <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <ShieldCheck size={14} className="text-emerald-500" /> Verified Account
               </span>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Basic Info Form */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Personal Information</h3>
            </div>
            
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Identity</label>
                  <input 
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>
              </div>
              <button 
                type="submit" disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Update Profile
              </button>
            </form>
          </motion.div>

          {/* Security Form */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Security & Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Current Password</label>
                <input 
                  type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">New Password</label>
                  <input 
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Confirm New Password</label>
                  <input 
                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-xl transition-all active:scale-95 disabled:opacity-30"
              >
                {isChangingPassword ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                Change Password
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
