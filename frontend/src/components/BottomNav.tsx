import { Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, MessageSquare, Video, Headphones as HeadphonesIcon, Crown, Users, Radio } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface BottomNavProps {
  onRequiresAuth: () => void;
}

export default function BottomNav({ onRequiresAuth }: BottomNavProps) {
  const { isAuthenticated, guestAccessEnabled } = useAuthStore();
  const navigate = useNavigate();

  const handleProtectedAction = (path: string) => {
    if (!isAuthenticated && !guestAccessEnabled) {
      onRequiresAuth();
    } else {
      navigate(path);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111]/90 backdrop-blur-xl border-t border-white/10 z-[110] px-4 py-3 flex justify-between items-center pb-safe gap-1 text-[9px] sm:text-[10px]">
      <Link to="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <HomeIcon size={20} />
        <span className="font-medium">Home</span>
      </Link>
      <button onClick={() => handleProtectedAction('/setup/text')} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <MessageSquare size={20} />
        <span className="font-medium">Chat</span>
      </button>
      <button onClick={() => handleProtectedAction('/groups')} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <Users size={20} />
        <span className="font-medium">Groups</span>
      </button>
      <button onClick={() => handleProtectedAction('/setup/video')} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <Video size={20} />
        <span className="font-medium">Video</span>
      </button>
      <button onClick={() => handleProtectedAction('/setup/audio')} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <HeadphonesIcon size={20} />
        <span className="font-medium">Audio</span>
      </button>
      <button onClick={() => handleProtectedAction('/live')} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
        <Radio size={20} />
        <span className="font-medium">Live</span>
      </button>
      <Link to="/pricing" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-yellow-400 transition-colors cursor-pointer relative group">
        <Crown size={20} className={isAuthenticated && useAuthStore.getState().user?.premiumStatus ? 'text-yellow-400' : ''} />
        <span className="font-medium">Premium</span>
      </Link>
    </div>
  );
}
