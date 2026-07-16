import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import GameComponent from '../game/GameComponent';
import { Trophy, ShieldAlert, Lock, Play, Compass, Gem, Coins, CheckCircle2 } from 'lucide-react';

export default function GameMap() {
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'science'>('math');
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  
  // Reward success screens
  const [rewardsEarned, setRewardsEarned] = useState<any | null>(null);

  // Fetch subjects curriculum list
  const { data: subjects, isLoading: subsLoading } = useQuery({
    queryKey: ['curriculumSubjects'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data.data;
    },
  });

  const activeSubjectId = subjects?.find((s: any) => s.code === selectedSubject)?._id;

  // Fetch chapters & missions for the selected subject
  const { data: curriculumData, isLoading: currLoading, refetch } = useQuery({
    queryKey: ['curriculumMap', activeSubjectId],
    queryFn: async () => {
      if (!activeSubjectId) return null;
      
      const chapRes = await api.get(`/curriculum/subjects/${activeSubjectId}/chapters`);
      const chapters = chapRes.data.data;

      // Pull missions for the first topic of first chapter (simplified map layout)
      const firstChapterId = chapters[0]?._id;
      if (!firstChapterId) return { chapters, levels: [] };

      const topRes = await api.get(`/curriculum/chapters/${firstChapterId}/topics`);
      const topics = topRes.data.data;

      const firstTopicId = topics[0]?._id;
      if (!firstTopicId) return { chapters, levels: [] };

      const misRes = await api.get(`/curriculum/topics/${firstTopicId}/missions`);
      const missions = misRes.data.data;

      // Pull game levels associated with these missions
      const levelsList = [];
      for (const m of missions) {
        // We look up dummy level ids (for seeding mock lookup: we query levels dynamically or generate sequential markers)
        // In the interest of full reliability, we render the levels list as derived from missions
        levelsList.push({
          id: m._id, // Mission ID can represent node activation
          levelNumber: m.sequence,
          name: m.name,
          type: m.type,
          unlocked: m.sequence <= 3, // Mock unlocks: level 1-3 unlocked
          completed: m.sequence < 2,   // level 1 completed
          rewards: {
            xp: m.xpReward,
            coins: m.coinReward,
            gems: m.crystalReward,
          },
        });
      }

      return {
        chapters,
        levels: levelsList,
      };
    },
    enabled: !!activeSubjectId,
  });

  const handleLevelComplete = (rewards: any) => {
    setRewardsEarned(rewards);
    setActiveLevelId(null);
    refetch(); // Reload map state
  };

  if (subsLoading || currLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Building Kingdom Maps...</p>
      </div>
    );
  }

  const levels = curriculumData?.levels || [];
  const chapters = curriculumData?.chapters || [];

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 relative pb-20">
      
      {/* 1. Kingdom Selector header */}
      <div className="w-full glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-accent-gold" />
          <h2 className="font-extrabold text-lg">Curriculum Kingdoms</h2>
        </div>

        <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSelectedSubject('math')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedSubject === 'math'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Math Kingdom (50 Stages)
          </button>
          <button
            onClick={() => setSelectedSubject('science')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedSubject === 'science'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Science City (20 Stages)
          </button>
        </div>
      </div>

      {/* 2. World Banner */}
      {chapters.length > 0 && (
        <div className="w-full glass-card p-6 bg-gradient-to-r from-slate-900/90 to-cyan-950/20 border-cyan-500/10 flex flex-col gap-2">
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/20 w-fit uppercase">
            Chapter 1
          </span>
          <h1 className="text-2xl font-black text-slate-200">{chapters[0].name}</h1>
          <p className="text-xs text-slate-400">{chapters[0].description}</p>
        </div>
      )}

      {/* 3. Duolingo Style Progress path */}
      <div className="flex flex-col items-center gap-8 my-8 relative w-full">
        {/* Connection Line */}
        <div className="absolute top-8 bottom-8 w-1.5 bg-slate-800/80 rounded-full -z-10" />

        {levels.map((lvl: any, index: number) => {
          // Calculate Zig-Zag layout coordinates
          // Offset shifts: left, center, right, center
          const offsets = ['translate-x-0', 'translate-x-12', 'translate-x-0', '-translate-x-12'];
          const offsetClass = offsets[index % 4];

          const isLocked = !lvl.unlocked;
          const isCompleted = lvl.completed;
          const isActive = lvl.unlocked && !lvl.completed;

          return (
            <div key={lvl.id} className={`flex flex-col items-center gap-2 transition-all ${offsetClass}`}>
              <button
                disabled={isLocked}
                onClick={() => setActiveLevelId(lvl.id)}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg transition-all relative ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-400 hover:brightness-110'
                    : isActive
                    ? 'bg-amber-500 border-yellow-300 hover:brightness-110 animate-pulse-glow'
                    : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-7 w-7 text-slate-950" />
                ) : isLocked ? (
                  <Lock className="h-6 w-6 text-slate-500" />
                ) : (
                  <Play className="h-7 w-7 text-slate-950 fill-slate-950 ml-1" />
                )}

                {/* Level Counter marker */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-black flex items-center justify-center text-slate-200">
                  {lvl.levelNumber}
                </div>
              </button>

              <span className="text-xs font-bold text-slate-400">{lvl.type === 'boss' ? '👑 BOSS' : lvl.name}</span>
            </div>
          );
        })}
      </div>

      {/* 4. Phaser Modal overlay */}
      {activeLevelId && (
        <GameComponent
          levelId={activeLevelId}
          onClose={() => setActiveLevelId(null)}
          onComplete={handleLevelComplete}
        />
      )}

      {/* 5. Rewards Success Dialog modal */}
      {rewardsEarned && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm glass-card p-8 text-center flex flex-col items-center gap-6 relative border-amber-500/20">
            {/* Background glowing spheres */}
            <div className="absolute w-24 h-24 bg-amber-500/10 rounded-full filter blur-xl -z-10" />

            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-accent-gold">
              <Trophy className="h-8 w-8 animate-bounce-slow" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-slate-100 font-sans">Mission Cleared!</h2>
              <p className="text-xs text-slate-400 font-medium">Rewards credited safely to wallet ledger</p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex flex-col items-center gap-1.5 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">XP</span>
                <span className="font-extrabold text-sm text-yellow-400">+{rewardsEarned.xp || 50}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coins</span>
                <div className="flex items-center gap-0.5 text-accent-gold font-extrabold text-sm">
                  <Coins className="h-4 w-4 fill-accent-gold text-accent-gold" />
                  <span>+{rewardsEarned.coins || 10}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gems</span>
                <div className="flex items-center gap-0.5 text-accent-violet font-extrabold text-sm">
                  <Gem className="h-4 w-4 fill-accent-violet text-accent-violet" />
                  <span>+{rewardsEarned.gems || 0}</span>
                </div>
              </div>
            </div>

            <button onClick={() => setRewardsEarned(null)} className="btn-gold w-full text-sm py-3 font-extrabold">
              Awesome, Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
