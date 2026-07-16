import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Trophy, AlertCircle, Calendar, Sparkles, MapPin } from 'lucide-react';

export default function TournamentsList() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  // Fetch active tournaments
  const { data: tournaments, isLoading: tourLoading } = useQuery({
    queryKey: ['tournamentsList'],
    queryFn: async () => {
      const res = await api.get('/social/tournaments');
      return res.data.data;
    },
  });

  // Set default tournament on load
  React.useEffect(() => {
    if (tournaments && tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0]._id);
    }
  }, [tournaments, selectedTournamentId]);

  // Fetch tournament leaderboard ranks
  const { data: rankings, isLoading: ranksLoading } = useQuery({
    queryKey: ['tournamentLeaderboard', selectedTournamentId],
    queryFn: async () => {
      if (!selectedTournamentId) return null;
      const res = await api.get(`/social/leaderboard?scope=tournament&tournamentId=${selectedTournamentId}`);
      return res.data.data;
    },
    enabled: !!selectedTournamentId,
  });

  if (tourLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Opening Tournament Arenas...</p>
      </div>
    );
  }

  const activeTour = tournaments?.find((t: any) => t._id === selectedTournamentId);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="glass-card p-6 flex items-center gap-3 bg-gradient-to-r from-slate-900/80 to-amber-950/10 border-amber-500/10">
        <Trophy className="h-8 w-8 text-accent-gold" />
        <div>
          <h1 className="text-2xl font-black font-sans">School Tournaments</h1>
          <p className="text-xs text-slate-400">School-vs-School gaming championships</p>
        </div>
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <div className="text-center p-12 glass-card border-slate-800">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Active Tournaments</h3>
          <p className="text-xs text-slate-500 mt-1">Championship events are scheduled during school terms.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* List panel */}
          <div className="flex flex-col gap-4">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider px-1">Championships</h3>
            {tournaments.map((t: any) => (
              <button
                key={t._id}
                onClick={() => setSelectedTournamentId(t._id)}
                className={`p-5 text-left rounded-2xl border flex flex-col gap-2 transition-all w-full ${
                  selectedTournamentId === t._id
                    ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900/60'
                }`}
              >
                <h4 className="font-bold text-sm text-slate-200">{t.name}</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Ends: {new Date(t.endDate).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          {/* Leaderboard details panel */}
          <div className="md:col-span-2 glass-card p-6 flex flex-col gap-6">
            {activeTour && (
              <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
                <span className="text-[10px] bg-amber-500/10 text-accent-gold font-extrabold px-2 py-0.5 rounded border border-amber-500/20 w-fit uppercase">
                  ACTIVE
                </span>
                <h2 className="text-xl font-bold text-slate-200 mt-1">{activeTour.name}</h2>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{activeTour.description}</p>
              </div>
            )}

            {ranksLoading ? (
              <div className="text-center py-10 text-xs text-slate-500">Recalculating scores...</div>
            ) : !rankings || rankings.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-slate-600" />
                <p className="text-xs text-slate-500 font-bold">No school logs found</p>
                <button className="btn-cyan text-xs mt-2 px-4 py-2">Register School Team</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-850 pb-2">
                  <span>SCHOOL TEAM STANDINGS</span>
                  <span>ACCUMULATED POINTS</span>
                </div>

                <div className="flex flex-col gap-3">
                  {rankings.map((r: any) => (
                    <div key={r.rank} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                          r.rank === 1
                            ? 'bg-yellow-500 text-slate-950 shadow-md'
                            : r.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : r.rank === 3
                            ? 'bg-orange-500 text-slate-950'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}>
                          {r.rank}
                        </span>
                        
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs text-slate-200">{r.schoolName}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-medium">{r.studentName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-accent-gold font-extrabold text-sm">
                        <Sparkles className="h-4 w-4" /> {r.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
