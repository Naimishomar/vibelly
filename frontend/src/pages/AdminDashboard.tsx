import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, ArrowLeft, Search, Loader2, AlertTriangle, Ban, CheckCircle, ChevronDown, ChevronUp, Video, Phone, MessageSquare, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface AdminUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  premiumStatus: boolean;
  createdAt: string;
  isBanned: boolean;
}

interface SessionData {
  _id: string;
  roomId: string;
  user1: string;
  user2: string;
  callType: string;
  quality: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
}

interface ReportData {
  _id: string;
  reporter: { _id: string; name: string; username: string; email: string; isBanned: boolean };
  reportedUser: { _id: string; name: string; username: string; email: string; isBanned: boolean };
  reason: string;
  createdAt: string;
  sessions: SessionData[];
}

export default function AdminDashboard() {
  const { user, guestAccessEnabled, fetchSettings } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [uniqueVisitsToday, setUniqueVisitsToday] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    // If not admin, redirect immediately
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const token = localStorage.getItem('vibe_token') || useAuthStore.getState().accessToken;
        
        const [usersRes, reportsRes, analyticsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/admin/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data);
        }
        
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setUniqueVisitsToday(data.uniqueVisitsToday);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('vibe_token') || useAuthStore.getState().accessToken;
      const action = currentStatus ? 'unban' : 'ban';
      
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
        setReports(reports.map(r => {
          let newR = { ...r };
          if (r.reporter?._id === userId) newR.reporter.isBanned = !currentStatus;
          if (r.reportedUser?._id === userId) newR.reportedUser.isBanned = !currentStatus;
          return newR;
        }));
      }
    } catch (error) {
      console.error('Error toggling ban:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredReports = reports.filter(r => 
    r.reporter?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleGuestAccess = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('vibe_token') || useAuthStore.getState().accessToken;
      
      const response = await fetch(`${backendUrl}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ guestAccessEnabled: !guestAccessEnabled })
      });
      
      if (response.ok) {
        // Refresh the global state to reflect the new setting
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error toggling guest access:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-white/30 selection:text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm font-medium">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'Georgia, serif' }}>
                  Admin Dashboard
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Manage users and oversee platform activity.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2 w-full md:w-80">
              <Search className="text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-zinc-600"
              />
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/40 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                Reports
              </button>
            </div>
          </div>
        </div>

        {/* Security Controls */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${guestAccessEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Guest Access</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {guestAccessEnabled 
                  ? "Unauthenticated users CAN access matchmaking and chat." 
                  : "Unauthenticated users are completely BLOCKED from core features."}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleToggleGuestAccess}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${guestAccessEnabled ? 'bg-emerald-500' : 'bg-zinc-600'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${guestAccessEnabled ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-zinc-400">
              <Users size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Total Users</span>
            </div>
            <p className="text-4xl font-light text-white">{isLoading ? '-' : users.length}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-zinc-400">
              <Crown size={18} className="text-yellow-500" />
              <span className="text-sm font-medium uppercase tracking-wider">Premium Users</span>
            </div>
            <p className="text-4xl font-light text-white">{isLoading ? '-' : users.filter(u => u.premiumStatus).length}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-zinc-400">
              <Users size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Unique Visits Today</span>
            </div>
            <p className="text-4xl font-light text-white">{isLoading ? '-' : uniqueVisitsToday}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-zinc-400">
              <Shield size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Admins</span>
            </div>
            <p className="text-4xl font-light text-white">{isLoading ? '-' : users.filter(u => u.role === 'admin').length}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-zinc-400">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Total Reports</span>
            </div>
            <p className="text-4xl font-light text-white">{isLoading ? '-' : reports.length}</p>
          </motion.div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'users' ? (
        <div className="bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-20">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-medium text-white">Registered Users</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/[0.02] text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">User</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Email</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Role</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Premium</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Joined</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{u.name}</span>
                            {u.isBanned && <span className="text-red-500 text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Banned</span>}
                          </div>
                          <span className="text-zinc-500 text-xs">@{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{u.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase ${
                          u.role === 'admin' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-white/5 text-zinc-400 border border-white/10'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.premiumStatus ? (
                          <span className="text-yellow-400 font-medium text-xs">Premium</span>
                        ) : (
                          <span className="text-zinc-600 text-xs">Free</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBan(u._id, u.isBanned)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              u.isBanned 
                                ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700' 
                                : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <div className="flex flex-col gap-4 mb-20">
            {isLoading ? (
              <div className="py-12 text-center text-zinc-500">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Loading reports...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 bg-zinc-900/40 rounded-3xl border border-white/10">
                No reports found.
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report._id} className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden transition-all">
                  <div 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                    onClick={() => setExpandedReportId(expandedReportId === report._id ? null : report._id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-red-500/20 text-red-500 p-2 rounded-xl">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{report.reporter?.name || 'Unknown User'}</span>
                          <span className="text-zinc-500 text-xs">reported</span>
                          <span className="text-red-400 font-medium">{report.reportedUser?.name || 'Unknown User'}</span>
                        </div>
                        <div className="text-zinc-400 text-sm">
                          Reason: <span className="text-white">{report.reason}</span>
                        </div>
                        <div className="text-zinc-600 text-xs mt-2">
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-auto">
                      {report.reportedUser && !report.reportedUser.isBanned && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleBan(report.reportedUser._id, false); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <Ban size={14} /> Ban User
                        </button>
                      )}
                      {report.reportedUser && report.reportedUser.isBanned && (
                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-green-500" /> Banned
                        </div>
                      )}
                      <div className="text-zinc-500">
                        {expandedReportId === report._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Session Data */}
                  {expandedReportId === report._id && (
                    <div className="border-t border-white/5 bg-black/20 p-5">
                      <h4 className="text-sm font-medium text-white mb-4">Related Session Data (Past 24h)</h4>
                      
                      {report.sessions && report.sessions.length > 0 ? (
                        <div className="space-y-3">
                          {report.sessions.map((session, idx) => (
                            <div key={idx} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400">
                                  {session.callType === 'video' ? <Video size={16} /> : session.callType === 'audio' ? <Phone size={16} /> : <MessageSquare size={16} />}
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium capitalize">{session.callType} Call</div>
                                  <div className="text-zinc-500 text-xs">Room: {session.roomId}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-zinc-400">
                                  <span className="text-zinc-500 block text-[10px] uppercase">Started</span>
                                  {new Date(session.startedAt).toLocaleTimeString()}
                                </div>
                                <div className="text-zinc-400">
                                  <span className="text-zinc-500 block text-[10px] uppercase">Duration</span>
                                  {session.duration ? `${Math.round(session.duration)}s` : 'Ongoing'}
                                </div>
                                <div className="text-zinc-400">
                                  <span className="text-zinc-500 block text-[10px] uppercase">Quality</span>
                                  {session.quality || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-zinc-500 text-sm bg-zinc-900/40 rounded-xl border border-white/5">
                          No recent sessions found between these users in the past 24 hours.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
