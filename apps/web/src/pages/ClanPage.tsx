import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Shield, Users, MessageSquare, AlertCircle, Sparkles, Send } from 'lucide-react';

export default function ClanPage() {
  // Clan state
  const [clanCode, setClanCode] = useState('');
  const [clanName, setClanName] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch my clan details
  const { data: clanData, isLoading, refetch } = useQuery({
    queryKey: ['myClanDetails'],
    queryFn: async () => {
      const res = await api.get('/social/clan/my-clan');
      return res.data.data;
    },
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clanCode.trim()) return;
    setLoadingAction(true);

    try {
      await api.post('/social/clan/join', { code: clanCode });
      alert('Welcome to the Clan!');
      setClanCode('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join clan.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clanName.trim()) return;
    setLoadingAction(true);

    try {
      await api.post('/social/clan/create', { name: clanName });
      alert('Clan founded successfully!');
      setClanName('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create clan.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    setLoadingAction(true);

    try {
      await api.post('/social/clan/announcement', { title: annTitle, body: annBody });
      alert('Announcement posted!');
      setAnnTitle('');
      setAnnBody('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setLoadingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Entering Clan Hall...</p>
      </div>
    );
  }

  // User has no clan: show join/create dashboard
  if (!clanData) {
    return (
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* Join Clan Card */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold font-sans">Join a Clan</h2>
              <p className="text-xs text-slate-400">Collaborate with fellow students on learning targets</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clan Code</label>
              <input
                type="text"
                value={clanCode}
                onChange={(e) => setClanCode(e.target.value.toUpperCase())}
                placeholder="e.g. TIGERS"
                className="glass-input"
              />
            </div>
            <button
              type="submit"
              disabled={loadingAction}
              className="btn-cyan w-full text-xs py-3 flex items-center justify-center font-bold"
            >
              {loadingAction ? 'Joining...' : 'Apply Clan Code'}
            </button>
          </form>
        </div>

        {/* Create Clan Card */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent-gold" />
            <div>
              <h2 className="text-xl font-bold font-sans">Found a Clan</h2>
              <p className="text-xs text-slate-400">Establish a new study crew (Requires 100 Coins)</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clan Name</label>
              <input
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                placeholder="e.g. Space Knights"
                className="glass-input"
              />
            </div>
            <button
              type="submit"
              disabled={loadingAction}
              className="btn-gold w-full text-xs py-3 flex items-center justify-center font-bold"
            >
              {loadingAction ? 'Founding...' : 'Deduct Coins & Create'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { clan, members } = clanData;
  const isLeaderOrElder = members.some(
    (m: any) => m.studentId?._id === clan.creatorId && ['leader', 'elder'].includes(m.role)
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Clan banner */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900/80 to-emerald-950/10 border-emerald-500/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-accent-emerald">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-sans">{clan.name}</h1>
            <p className="text-xs text-slate-400">Code: <span className="font-extrabold text-slate-200">{clan.code}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/60 px-5 py-2.5 rounded-2xl border border-slate-800 text-xs text-slate-400">
          <span className="font-bold">Members: <span className="text-slate-200">{clan.membersCount}</span></span>
          <span className="font-bold">Weekly XP: <span className="text-emerald-400">{clan.weeklyXPEarned}</span></span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: members list */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Members list roster */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold">Clan Roster</h3>
            </div>

            <div className="flex flex-col gap-3">
              {members.map((m: any) => (
                <div key={m._id} className="flex items-center justify-between p-4 bg-slate-950/30 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {m.studentId?.selectedAvatarId === 'boy' ? '👦' : '👧'}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-slate-200">
                        {m.studentId?.firstName} {m.studentId?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">{m.studentId?.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                      XP: {m.studentId?.xp}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700/50 px-2.5 py-1 rounded-full">
                      {m.role.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: announcements board */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-accent-gold font-bold">
              <MessageSquare className="h-5 w-5" /> Announcements
            </div>

            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
              {clan.announcements.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No recent announcements posted.</p>
              ) : (
                clan.announcements.map((ann: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 flex flex-col gap-1">
                    <h4 className="font-bold text-xs text-slate-200">{ann.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ann.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post announcement form (Leaders only) */}
            {isLeaderOrElder && (
              <form onSubmit={handleAnnounce} className="border-t border-slate-800 pt-4 mt-2 flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Announcement Title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="glass-input py-2 text-xs"
                />
                <textarea
                  placeholder="Announcements description body..."
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="glass-input py-2 text-xs h-16 resize-none"
                />
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="btn-gold w-full text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Broadcast Announcement
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
