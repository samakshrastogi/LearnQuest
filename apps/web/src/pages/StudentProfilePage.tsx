import React from 'react';
import { useAuthStore } from '../store/auth';
import { User, Sparkles, BookOpen, Clock, Heart } from 'lucide-react';

export default function StudentProfilePage() {
  const { profile } = useAuthStore();

  if (!profile) return null;

  const level = Math.floor(profile.xp / 1000) + 1;
  const xpThreshold = level * 1000;
  const xpProgress = profile.xp % 1000;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Banner */}
      <div className="glass-card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-slate-900/80 to-cyan-950/10 border-cyan-500/10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-4xl shadow-lg border-2 border-yellow-400">
          {profile.selectedAvatarId === 'boy' ? '👦' : '👧'}
        </div>
        
        <div className="flex-1 flex flex-col gap-2 text-center sm:text-left">
          <span className="text-[10px] bg-amber-500/10 text-accent-gold font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/20 w-fit mx-auto sm:mx-0 uppercase tracking-widest">
            {profile.title}
          </span>
          <h1 className="text-2xl font-black font-sans text-slate-100">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-xs text-slate-400">Class {profile.classLevel} - {profile.board} Board</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col: stats breakdown */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 grid grid-cols-2 gap-4">
            {/* Stat 1 */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Level</span>
                <span className="font-extrabold text-sm text-slate-200">{level}</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Total XP</span>
                <span className="font-extrabold text-sm text-slate-200">{profile.xp} XP</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center gap-3">
              <Clock className="h-6 w-6 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Streak</span>
                <span className="font-extrabold text-sm text-slate-200">{profile.streakCount} days</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 flex items-center gap-3">
              <Heart className="h-6 w-6 text-red-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Coins</span>
                <span className="font-extrabold text-sm text-slate-200">{profile.coins}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: equipped customizations list */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Equipped Cosmetics</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(profile.selectedInventoryItems).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-xs">
                <span className="text-slate-400 capitalize">{key}</span>
                <span className="font-bold text-accent-gold uppercase tracking-wider text-[10px]">
                  {String(val).replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
