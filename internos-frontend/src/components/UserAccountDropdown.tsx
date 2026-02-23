import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  LogOut, 
  Settings, 
  Shield, 
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../api/auth.service';
import profileService from '../api/profile.service';
import { getCachedProfilePhoto, setCachedProfilePhoto } from '../utils/profilePhotoCache';

const UserAccountDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = authService.getCurrentUser();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(getCachedProfilePhoto(user?.id));
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mbyll menunë nëse klikon jashtë saj
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    profileService
      .getMyProfile()
      .then((data) => {
        const photo = data.profilePhotoUrl || null;
        setProfilePhotoUrl(photo);
        setCachedProfilePhoto(user.id, photo);
      })
      .catch(() => {
        // Keep cached photo when profile API is temporarily unavailable.
      });
  }, [user?.id]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="relative w-full px-4 mb-8 mt-auto" ref={dropdownRef}>
      
      {/* Pop-up Menuja */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-4 right-4 mb-4 bg-slate-800 border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden z-[60]"
          >
            <div className="p-2 space-y-1">
              <button 
                onClick={() => { navigate('/profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-2xl transition-all font-bold text-xs group"
              >
                <Settings size={16} className="group-hover:rotate-45 transition-transform" />
                Profile Settings
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-2xl transition-all font-bold text-xs">
                <Shield size={16} />
                Security Privacy
              </button>

              <div className="h-px bg-slate-700/50 mx-4 my-1" />

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-xs"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Butoni i Identitetit (Kutia që klikohet) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 w-full p-3 rounded-[2rem] border transition-all duration-300
          ${isOpen 
            ? 'bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
            : 'bg-slate-800/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700'
          }
        `}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-700 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className={`text-sm font-black ${isOpen ? "text-indigo-400" : "text-slate-400"}`}>
              {user?.fullName?.charAt(0) ?? <UserCircle size={24} />}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold truncate text-slate-100">{user?.fullName}</p>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">{user?.role}</p>
        </div>

        <ChevronUp 
          size={16} 
          className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
    </div>
  );
};

export default UserAccountDropdown;
