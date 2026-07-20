import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Coins, ShieldAlert, Sparkles, BookOpen, Clock, BrainCircuit, Play } from 'lucide-react';

export default function StudentDashboard() {
  const { t } = useTranslation();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const res = await api.get('/students/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md mx-auto mt-10">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-400">Failed to load dashboard data</h3>
        <p className="text-xs text-slate-400 mt-1">Please verify your server connection.</p>
      </div>
    );
  }

  const { student, weakTopics, recentAttempts, recommendedReel, quests } = dashboardData;

  // Mock Recharts daily activity minutes chart
  const activityData = [
    { day: 'Mon', minutes: 12 },
    { day: 'Tue', minutes: 20 },
    { day: 'Wed', minutes: 8 },
    { day: 'Thu', minutes: 25 },
    { day: 'Fri', minutes: 15 },
    { day: 'Sat', minutes: 30 },
    { day: 'Sun', minutes: 18 },
  ];

  const { updateWallet } = useAuthStore();
  const [claimedQuests, setClaimedQuests] = useState<string[]>([]);

  const handleClaimQuest = async (questId: string) => {
    try {
      const res = await api.post('/students/claim-quest', { questId });
      const { wallet } = res.data.data;
      updateWallet(wallet);
      setClaimedQuests((prev: string[]) => [...prev, questId]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to claim quest reward.');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* 1. Header Hero Card */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-amber-950/15 border-amber-500/10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">
            Hey, {student.firstName}!
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            {t('tagline')}
          </p>
        </div>
        <Link to="/game" className="btn-gold px-8 py-3.5 flex items-center gap-2 shadow-xl hover:scale-[1.02] transition-all">
          <Play className="h-5 w-5 fill-slate-950 text-slate-950" /> {t('continueQuest')}
        </Link>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side: Stats and charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Week Activity Graph */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold">Weekly Study Minutes</h3>
            </div>
            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="minutes" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Quests Checklist */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold">{t('dailyQuests')}</h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-700/50">
                Resets in 12h
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {quests.map((q: any) => {
                const isClaimed = claimedQuests.includes(q.id);
                return (
                  <div key={q.id} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-bold text-sm ${q.isCompleted || isClaimed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {q.title}
                      </span>
                      <span className="text-xs text-slate-400">{q.description}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">
                        {q.currentValue} / {q.targetValue}
                      </span>
                      {isClaimed ? (
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                          CLAIMED (+25 XP)
                        </span>
                      ) : q.isCompleted ? (
                        <button
                          onClick={() => handleClaimQuest(q.id)}
                          className="btn-gold px-3 py-1 text-xs font-bold shadow-md"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-700">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Weak topics warning and Recommendations */}
        <div className="flex flex-col gap-6">
          {/* Weak Topics Warning alerts */}
          {weakTopics.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm tracking-wide uppercase">
                <ShieldAlert className="h-5 w-5" /> {t('weakTopicWarning')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guruji has detected low accuracy in these subjects. Let's practice them to recover crystal fragments:
              </p>
              <div className="flex flex-col gap-2">
                {weakTopics.map((wt: any) => (
                  <div key={wt._id} className="flex flex-col gap-0.5 p-3 bg-red-950/20 border border-red-500/10 rounded-xl">
                    <span className="font-bold text-xs text-slate-200">{wt.topicId?.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">
                      {wt.topicId?.chapterId?.name}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/game" className="btn-outline text-xs text-center border-red-500/20 text-slate-300 hover:bg-red-500/10 py-2.5">
                Revise Concept Maps
              </Link>
            </div>
          )}

          {/* Recommended learning Video Reel */}
          {recommendedReel && (
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent-cyan" />
                <h3 className="font-bold">{t('recommendedVideo')}</h3>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-3">
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative flex items-center justify-center">
                  <Play className="h-8 w-8 text-cyan-400 fill-cyan-400" />
                  <span className="absolute bottom-2 right-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded font-bold text-slate-300">
                    REEL QUIZ
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                    {recommendedReel.subjectId?.name}
                  </span>
                  <h4 className="font-bold text-sm text-slate-200">{recommendedReel.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{recommendedReel.description}</p>
                </div>
                <Link to="/reels" className="btn-cyan w-full py-2.5 text-center text-xs shadow-md">
                  Watch Video Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
