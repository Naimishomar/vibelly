import { Link } from 'react-router-dom';
import { LogOut, User, Settings, Shield, Gift, Radio } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';
import ReferralModal from './ReferralModal';
import ThemeToggle from './ThemeToggle';
import BottomNav from './BottomNav';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [liveUsers, setLiveUsers] = useState(5500 + Math.floor(Math.random() * 500));
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated, logout, guestAccessEnabled } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(5500 + Math.floor(Math.random() * 500));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProtectedAction = (path: string) => {
    if (!isAuthenticated && !guestAccessEnabled) {
      setIsLoginModalOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <nav id="main-header" className="flex items-center justify-between py-4 px-6 max-w-7xl mx-auto w-full text-sm text-zinc-400 relative z-50">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-base tracking-tight">
          <img 
            src="https://i.pinimg.com/736x/bf/f9/90/bff990bfc21bdc142b69c6ed28b53b6d.jpg" 
            alt="Vibelly Logo" 
            className="w-12 h-12 rounded-full object-cover shadow-lg shadow-black/50" 
          />
          <span className='text-2xl font-serif font-black'>Vibelly</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">Home</Link>
          <button onClick={() => handleProtectedAction('/setup/video')} className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer">Video Call</button>
          <button onClick={() => handleProtectedAction('/setup/audio')} className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer">Audio Call</button>
          <button onClick={() => handleProtectedAction('/setup/text')} className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer">Chat</button>
          <button onClick={() => handleProtectedAction('/groups')} className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer">Groups</button>
          <button onClick={() => handleProtectedAction('/live')} className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer">Live</button>
          <Link to="/pricing" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">Pricing</Link>
        </div>

        {/* CTAs / User */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {/* Live online user count */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 ml-5 bg-zinc-900/80 border border-white/30 rounded-full backdrop-blur-md">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-medium text-zinc-300">
                  <strong className="text-white font-semibold">{liveUsers.toLocaleString()}</strong> online
                </span>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:opacity-80 transition-all cursor-pointer ${
                    user?.premiumStatus 
                      ? 'p-[2px] bg-gradient-to-tr from-zinc-500 via-white to-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
                      : 'border border-white/10 hover:border-white/30 overflow-hidden'
                  }`}
                >
                  {user?.premiumStatus ? (
                    <div className="w-full h-full rounded-full bg-[#15171B] flex items-center justify-center p-[2px]">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="text-white w-4 h-4" />
                      )}
                    </div>
                  ) : (
                    <>
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-white w-5 h-5" />
                      )}
                    </>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-zinc-400 truncate">@{user?.username}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to={`/creator/${user?._id}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors w-full text-left"
                      >
                        <Radio size={16} />
                        My Creator Profile
                      </Link>

                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsReferralModalOpen(true);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors w-full text-left cursor-pointer"
                      >
                        <Gift size={16} />
                        Invite & Earn Premium
                      </button>

                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsSettingsModalOpen(true);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors w-full text-left cursor-pointer"
                      >
                        <Settings size={16} />
                        Settings
                      </button>

                      {user?.role === 'admin' && (
                        <Link 
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors w-full text-left cursor-pointer"
                        >
                          <Shield size={16} />
                          Admin Panel
                        </Link>
                      )}
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-zinc-300 font-medium hover:text-white transition-colors text-[14px] px-4 py-2 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white text-black px-5 py-2 rounded-xl font-medium hover:bg-white/80 hover:text-black transition-colors text-[14px] cursor-pointer"
              >
                Sign Up
              </button>

              {/* Live online user count */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 ml-5  bg-zinc-900/80 border border-white/30 rounded-full backdrop-blur-md">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-medium text-zinc-300">
                  <strong className="text-white font-semibold">{liveUsers.toLocaleString()}</strong> online
                </span>
              </div>
            </div>
          )}
        </div>

      </nav>

      <BottomNav onRequiresAuth={() => setIsLoginModalOpen(true)} />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
      {isReferralModalOpen && <ReferralModal onClose={() => setIsReferralModalOpen(false)} />}
    </>
  );
}
