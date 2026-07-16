import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { BarChart3, AlertCircle, Sparkles } from 'lucide-react';

export default function Leaderboards() {
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['globalLeaderboard'],
    queryFn: async () => {
      const res = await api.get('/social/leaderboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Reading Hall of Fame...</p>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto mt-10">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">Failed to load rankings</h3>
        <p className="text-xs text-slate-500 mt-1">Check server connection.</p>
      </div>
    );
  }

  const topThree = leaderboardData.slice(0, 3);
  const remaining = leaderboardData.slice(3);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* Header */}
      <div className="w-full glass-card p-6 flex items-center gap-3 bg-gradient-to-r from-slate-900/80 to-cyan-950/10 border-cyan-500/10">
        <BarChart3 className="h-8 w-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-black font-sans">Leaderboard</h1>
          <p className="text-xs text-slate-400">Global Hall of Fame - Top Questors by XP</p>
        </div>
      </div>

      {/* Podium (Top 3) */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto items-end pt-8 w-full">
          {/* Second Place (Podium left) */}
          {topThree[1] && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">🥈</span>
              <div className="text-center">
                <h4 className="font-extrabold text-xs text-slate-200">{topThree[1].studentName}</h4>
                <span className="text-[9px] text-slate-500 uppercase font-bold">{topThree[1].title}</span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 w-full h-24 rounded-t-2xl flex flex-col items-center justify-center p-3 gap-1">
                <span className="text-xs text-slate-400 font-bold">2ND</span>
                <span className="text-xs text-cyan-400 font-extrabold">{topThree[1].score} XP</span>
              </div>
            </div>
          )}

          {/* First Place (Podium center) */}
          {topThree[0] && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl animate-bounce-slow">👑</span>
              <div className="text-center">
                <h4 className="font-black text-sm text-yellow-400">{topThree[0].studentName}</h4>
                <span className="text-[9px] text-slate-500 uppercase font-bold">{topThree[0].title}</span>
              </div>
              <div className="bg-gradient-to-t from-yellow-500/10 to-amber-500/20 border-2 border-accent-gold w-full h-32 rounded-t-2xl flex flex-col items-center justify-center p-3 gap-1 shadow-xl">
                <span className="text-xs text-accent-gold font-black">CHAMPION</span>
                <span className="text-sm font-black text-slate-200">{topThree[0].score} XP</span>
              </div>
            </div>
          )}

          {/* Third Place (Podium right) */}
          {topThree[2] && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">🥉</span>
              <div className="text-center">
                <h4 className="font-extrabold text-xs text-slate-200">{topThree[2].studentName}</h4>
                <span className="text-[9px] text-slate-500 uppercase font-bold">{topThree[2].title}</span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 w-full h-20 rounded-t-2xl flex flex-col items-center justify-center p-3 gap-1">
                <span className="text-xs text-slate-400 font-bold">3RD</span>
                <span className="text-xs text-orange-400 font-extrabold">{topThree[2].score} XP</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranks List (4-15) */}
      <div className="glass-card p-6 flex flex-col gap-3">
        {remaining.length === 0 && topThree.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No ranking entries found.</p>
        ) : (
          remaining.map((r: any) => (
            <div key={r.rank} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-xs font-bold flex items-center justify-center text-slate-400">
                  {r.rank}
                </span>
                
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-slate-200">{r.studentName}</span>
                  <span className="text-[9px] text-slate-500 uppercase font-medium">{r.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold text-sm">
                <Sparkles className="h-4 w-4 text-cyan-500" /> {r.score} XP
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
