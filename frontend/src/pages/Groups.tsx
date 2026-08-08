import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Users, Plus, ArrowRight, Settings, X, Hash, Image as ImageIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';

export default function Groups() {
  const [joinCode, setJoinCode] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Create Form State
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState('');
  const [isGroupPublic, setIsGroupPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    fetchGroups();
  }, [isAuthenticated]);

  const fetchGroups = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = useAuthStore.getState().accessToken || localStorage.getItem('vibe_token');
      const res = await fetch(`${backendUrl}/api/groups`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.groups) {
        const sortedGroups = data.groups.sort((a: any, b: any) => {
          const aIsAdmin = user?._id === a.adminId;
          const bIsAdmin = user?._id === b.adminId;
          if (aIsAdmin && !bIsAdmin) return -1;
          if (!aIsAdmin && bIsAdmin) return 1;
          return 0;
        });
        setGroups(sortedGroups);
      }
    } catch (e) {
      console.error('Failed to fetch groups', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      setGroupPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreating(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = useAuthStore.getState().accessToken || localStorage.getItem('vibe_token');
      
      let photoUrl = '';
      if (groupPhoto) {
        const formData = new FormData();
        formData.append('file', groupPhoto);
        const uploadRes = await fetch(`${backendUrl}/api/upload/group`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) photoUrl = uploadData.url;
      }

      const res = await fetch(`${backendUrl}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          photo: photoUrl,
          isPublic: isGroupPublic
        })
      });

      const data = await res.json();
      if (data.group) {
        navigate(`/groups/${data.group.roomId}`);
      }
    } catch (err) {
      console.error('Failed to create group', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/groups/${joinCode.trim().toUpperCase()}`);
    }
  };

  const handleLoginClose = () => {
    setIsLoginOpen(false);
    if (!useAuthStore.getState().isAuthenticated) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-white relative overflow-hidden">
      <SEO title="Groups | Vibelly" description="Create or join a group chat room." />
      <BlinkingDotsGrid opacity={0.6} />
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 relative z-10 max-w-5xl mx-auto w-full">
        {/* Header with Settings Icon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                title="Manage Groups"
              >
                <Settings size={20} />
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight">Active Groups</h1>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-zinc-500 py-20 bg-zinc-900/40 rounded-3xl border border-white/5">
              <Users size={48} className="mb-4 opacity-20" />
              <p>No active groups right now.</p>
              {isAuthenticated && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="mt-4 text-sm font-medium text-white hover:text-zinc-300 transition-colors bg-white/10 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Create the first one!
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group, idx) => (
                <motion.button
                  key={group.roomId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/groups/${group.roomId}`)}
                  className="bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-2xl p-5 flex flex-col items-start text-left transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 w-full mb-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                      {group.photo ? (
                        <img src={group.photo} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <Hash size={20} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate w-full">{group.name}</h3>
                      <p className="text-xs text-green-400 font-medium">Join Room • {group.roomId}</p>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mt-1">{group.description}</p>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal (Create / Join) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#131313] border border-white/10 rounded-3xl p-5 w-full max-w-md relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-3 right-3 p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2">
                  <img src="https://i.pinimg.com/736x/bf/f9/90/bff990bfc21bdc142b69c6ed28b53b6d.jpg" alt="Vibelly_logo" className="w-14 h-14 rounded-full object-cover shadow-md" />
                </div>
                <h2 className="text-xl font-bold mb-1">Group Settings</h2>
                <p className="text-xs text-zinc-400">Create a new group or join an existing one.</p>
              </div>

              <div className="space-y-4">
                {/* Create Group Form */}
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div 
                        className="w-14 h-14 bg-zinc-900 border border-white/10 border-dashed rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors relative overflow-hidden"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {groupPhotoPreview ? (
                          <img src={groupPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-zinc-500" />
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handlePhotoChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Group Name *</label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Anime Fans"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="What is this group about?"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600 resize-none h-14"
                    />
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl mt-2">
                    <div>
                      <p className="text-sm font-medium text-white">Public Group</p>
                      <p className="text-xs text-zinc-400">Anyone can see and join this group.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGroupPublic(!isGroupPublic)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex items-center px-1 shrink-0 ${isGroupPublic ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full transition-transform ${isGroupPublic ? 'bg-black translate-x-5' : 'bg-zinc-400 translate-x-0'}`} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!groupName.trim() || isCreating}
                    className="w-full bg-white text-black font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {isCreating ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span className="text-sm">Create New Group</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs font-medium uppercase tracking-wider">Or join with code</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={handleJoinGroup} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. VIBE-A1B2"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600 uppercase"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!joinCode.trim()}
                    className="bg-zinc-800 text-white px-6 rounded-xl font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <ArrowRight size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Outlet />

      <LoginModal isOpen={isLoginOpen} onClose={handleLoginClose} />
    </div>
  );
}
