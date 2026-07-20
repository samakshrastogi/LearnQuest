import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import GameComponent from '../game/GameComponent';
import { 
  Trophy, 
  Lock, 
  Play, 
  Compass, 
  Gem, 
  Coins, 
  CheckCircle2, 
  Star, 
  Crown, 
  Sparkles, 
  Swords, 
  Layers, 
  ShieldAlert, 
  ArrowRight,
  BookOpen,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface LevelData {
  id: string;
  levelNumber: number;
  chapter: number;
  chapterName: string;
  name: string;
  type: 'normal' | 'challenge' | 'story' | 'boss';
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0 to 3 stars
  rewards: {
    xp: number;
    coins: number;
    gems: number;
  };
}

export default function GameMap() {
  const { user, profile, updateWallet } = useAuthStore();
  const classLevel = profile?.classLevel || 5;

  const [selectedSubject, setSelectedSubject] = useState<'math' | 'science' | 'english'>('math');
  const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [rewardsEarned, setRewardsEarned] = useState<any | null>(null);

  // Completed levels tracking stored in localStorage per user
  const [completedLevelsMap, setCompletedLevelsMap] = useState<Record<string, { stars: number }>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`completed_levels_${user?.id || 'guest'}`);
      if (saved) {
        try {
          setCompletedLevelsMap(JSON.parse(saved));
        } catch (e) {
          // Ignored
        }
      }
    }
  }, [user?.id]);

  // Save progress helper
  const saveLevelProgress = (levelId: string, stars: number) => {
    const updated = {
      ...completedLevelsMap,
      [levelId]: { stars: Math.max(stars, completedLevelsMap[levelId]?.stars || 0) },
    };
    setCompletedLevelsMap(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`completed_levels_${user?.id || 'guest'}`, JSON.stringify(updated));
    }
  };

  // Generate 25 Stages Dynamically based on Subject & Student Class Level
  const generate25Levels = (subject: 'math' | 'science' | 'english'): LevelData[] => {
    const chapters = [
      { id: 1, name: 'Chapter 1: Base Camp & Foundations', icon: '🏕️' },
      { id: 2, name: 'Chapter 2: Enchanted Forest & Logic', icon: '🌲' },
      { id: 3, name: 'Chapter 3: Crystal Mines & Applications', icon: '💎' },
      { id: 4, name: 'Chapter 4: Shadow Castle & High Reasoning', icon: '🏰' },
      { id: 5, name: 'Chapter 5: Citadel of Legends & Final Mastery', icon: '👑' },
    ];

    const subjectTopics: Record<string, string[]> = {
      math: [
        'Place Value & Large Numbers', 'Addition & Subtraction Quest', 'Multiplication Tables', 'Division Algorithms', 'Math Boss: Guardian of Numbers',
        'Fractions & Decimals', 'Proper & Improper Fractions', 'Adding Unlike Fractions', 'Decimal Place Values', 'Forest Boss: Fraction Golem',
        'Geometry & Shapes', '2D & 3D Figures', 'Perimeter & Boundaries', 'Area Calculation', 'Mines Boss: Crystal Dragon',
        'Data Handling & Bar Graphs', 'Money & Currency Math', 'Time & Clock Reading', 'Measurement Units', 'Castle Boss: Shadow Warlock',
        'Algebraic Patterns', 'Symmetry & Rotations', 'Speed, Distance & Time', 'Word Problem Conquest', 'Final Master Exam: Grand Dragon'
      ],
      science: [
        'Living vs Non-Living Things', 'Plant Parts & Leaves', 'Photosynthesis Basics', 'Roots & Stems Exploration', 'Boss: Ancient Tree Spirit',
        'Animal Habitats', 'Herbivores & Carnivores', 'Adaptations & Camouflage', 'Food Chains & Webs', 'Boss: Jungle Panther Guardian',
        'States of Matter', 'Melting & Freezing', 'Evaporation & Water Cycle', 'Solubility & Mixtures', 'Boss: Crystal Elemental',
        'Force & Motion', 'Gravity & Friction', 'Simple Machines & Levers', 'Light & Shadow Mechanics', 'Boss: Shadow Serpent',
        'Human Body Systems', 'Digestive Quest', 'Circulatory System', 'Nervous System & Brain', 'Boss: Citadel Titan'
      ],
      english: [
        'Nouns & Proper Names', 'Pronouns & Substitution', 'Action Verbs', 'Descriptive Adjectives', 'Boss: Word Wizard',
        'Sentence Building', 'Punctuation Marks', 'Capitalization Rules', 'Articles (A, An, The)', 'Boss: Grammar Griffin',
        'Tenses: Present & Past', 'Future Tense Quests', 'Conjunctions (And, But, Or)', 'Prepositions of Place', 'Boss: Spellweaver Monster',
        'Synonyms & Antonyms', 'Prefixes & Suffixes', 'Idioms & Phrases', 'Reading Comprehension', 'Boss: Shadow Phantom',
        'Advanced Vocabulary', 'Paragraph Writing', 'Direct & Indirect Speech', 'Active & Passive Voice', 'Boss: Grand Sage of Words'
      ]
    };

    const topics = subjectTopics[subject] || subjectTopics.math;
    const levels: LevelData[] = [];

    for (let i = 1; i <= 25; i++) {
      const chapterIdx = Math.floor((i - 1) / 5);
      const ch = chapters[chapterIdx];
      const topicName = topics[i - 1] || `Quest Stage ${i}`;

      const levelId = `${subject}_level_${i}`;
      const savedInfo = completedLevelsMap[levelId];
      const isCompleted = !!savedInfo;
      const stars = savedInfo?.stars || 0;

      // Level 1 is always unlocked. Level N is unlocked if Level N-1 is completed
      const isUnlocked = i === 1 || !!completedLevelsMap[`${subject}_level_${i - 1}`];

      // Boss levels every 5th stage
      const isBoss = i % 5 === 0;

      levels.push({
        id: levelId,
        levelNumber: i,
        chapter: ch.id,
        chapterName: ch.name,
        name: isBoss ? `👑 ${topicName}` : `Class ${classLevel} - ${topicName}`,
        type: isBoss ? 'boss' : i % 3 === 0 ? 'challenge' : i % 2 === 0 ? 'story' : 'normal',
        unlocked: isUnlocked,
        completed: isCompleted,
        stars,
        rewards: {
          xp: isBoss ? 150 : 50,
          coins: isBoss ? 50 : 15,
          gems: isBoss ? 5 : 1,
        },
      });
    }

    return levels;
  };

  const levelsList = generate25Levels(selectedSubject);

  // Group levels by Chapter for clean section rendering
  const chaptersMap: Record<number, { name: string; levels: LevelData[] }> = {};
  levelsList.forEach((lvl) => {
    if (!chaptersMap[lvl.chapter]) {
      chaptersMap[lvl.chapter] = { name: lvl.chapterName, levels: [] };
    }
    chaptersMap[lvl.chapter].levels.push(lvl);
  });

  const handleLevelComplete = async (rewards: any) => {
    if (!selectedLevel) return;
    
    // Grant 3 stars for score >= 90%, 2 stars for >= 70%, 1 star otherwise
    const score = rewards.score || 100;
    const starsEarned = score >= 90 ? 3 : score >= 70 ? 2 : 1;

    saveLevelProgress(selectedLevel.id, starsEarned);
    
    // Update local state and trigger wallet refresh
    setRewardsEarned({ ...rewards, stars: starsEarned });
    setActiveLevelId(null);
    setSelectedLevel(null);

    // Call backend completion endpoint
    try {
      await api.post('/game/complete-level', {
        levelId: selectedLevel.id,
        score,
        timeSpentSeconds: rewards.timeSpentSeconds || 30,
      });
    } catch (e) {
      // Ignored if mock level ID
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 relative pb-24 px-4">
      
      {/* 1. Top Kingdom Selector Header */}
      <div className="w-full glass-card p-5 flex flex-col md:flex-row gap-4 items-center justify-between border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-accent-gold">
            <Compass className="h-6 w-6 animate-pulse-glow" />
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-100 flex items-center gap-2">
              Class {classLevel} Adventure Realm
              <span className="text-xs bg-slate-800 text-slate-400 font-bold px-2.5 py-0.5 rounded-full">
                25 Stages
              </span>
            </h1>
            <p className="text-xs text-slate-400">Master your syllabus through epic RPG quests & boss battles!</p>
          </div>
        </div>

        {/* Kingdom Selector Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setSelectedSubject('math')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              selectedSubject === 'math'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" /> Math Kingdom (25 Stages)
          </button>
          
          <button
            onClick={() => setSelectedSubject('science')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              selectedSubject === 'science'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" /> Science Realm (25 Stages)
          </button>

          <button
            onClick={() => setSelectedSubject('english')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              selectedSubject === 'english'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" /> English Land (25 Stages)
          </button>
        </div>
      </div>

      {/* 2. 25-Level Progression Winding Map Layout */}
      <div className="w-full flex flex-col items-center gap-12 my-4">
        
        {Object.entries(chaptersMap).map(([chapterId, chapterData]) => (
          <div key={chapterId} className="w-full flex flex-col items-center gap-8 relative">
            
            {/* Chapter Milestone Banner */}
            <div className="w-full glass-card p-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border-amber-500/20 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {chapterId === '1' ? '🏕️' : chapterId === '2' ? '🌲' : chapterId === '3' ? '💎' : chapterId === '4' ? '🏰' : '👑'}
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                    {chapterData.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">Class {classLevel} Curriculum Missions</p>
                </div>
              </div>
              
              <span className="text-xs font-extrabold text-accent-gold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Stage {((Number(chapterId) - 1) * 5) + 1} - {Number(chapterId) * 5}
              </span>
            </div>

            {/* Winding Zig-Zag Stage Nodes */}
            <div className="flex flex-col items-center gap-10 relative w-full my-4">
              
              {/* Background Connecting Path Line */}
              <div className="absolute top-6 bottom-6 w-2 bg-slate-800/80 rounded-full -z-10 shadow-inner" />

              {chapterData.levels.map((lvl, idx) => {
                // Alternating Winding Offset Pattern (Duolingo style)
                const offsets = ['translate-x-0', 'translate-x-16', 'translate-x-32', 'translate-x-16', 'translate-x-0', '-translate-x-16', '-translate-x-32', '-translate-x-16'];
                const offsetClass = offsets[(lvl.levelNumber - 1) % offsets.length];

                const isBoss = lvl.type === 'boss';

                return (
                  <div key={lvl.id} className={`flex flex-col items-center gap-2 transition-all ${offsetClass}`}>
                    
                    {/* Star Rating Badges */}
                    {lvl.completed && (
                      <div className="flex items-center gap-0.5 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800 shadow-md">
                        {[1, 2, 3].map((starNum) => (
                          <Star
                            key={starNum}
                            className={`h-3 w-3 ${
                              starNum <= lvl.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Level Button Node */}
                    <button
                      disabled={!lvl.unlocked}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`relative flex items-center justify-center border-4 rounded-full shadow-2xl transition-all transform hover:scale-110 ${
                        isBoss ? 'w-20 h-20' : 'w-16 h-16'
                      } ${
                        lvl.completed
                          ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/20'
                          : lvl.unlocked
                          ? isBoss
                            ? 'bg-red-600 border-yellow-400 shadow-red-500/40 animate-pulse-glow'
                            : 'bg-amber-500 border-yellow-300 shadow-amber-500/30 animate-bounce-slow'
                          : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {lvl.completed ? (
                        <CheckCircle2 className="h-8 w-8 text-slate-950 stroke-[3]" />
                      ) : !lvl.unlocked ? (
                        <Lock className="h-6 w-6 text-slate-600" />
                      ) : isBoss ? (
                        <Crown className="h-9 w-9 text-yellow-300 fill-yellow-300 animate-bounce" />
                      ) : (
                        <Play className="h-7 w-7 text-slate-950 fill-slate-950 ml-1" />
                      )}

                      {/* Floating Level Number Badge */}
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-700 text-xs font-black text-slate-200 flex items-center justify-center shadow-md">
                        {lvl.levelNumber}
                      </div>
                    </button>

                    {/* Level Title Tag */}
                    <div className="text-center flex flex-col items-center">
                      <span className={`text-[11px] font-black max-w-[160px] line-clamp-1 ${
                        isBoss ? 'text-amber-400 uppercase tracking-wide' : 'text-slate-300'
                      }`}>
                        {lvl.name}
                      </span>
                      
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Coins className="h-3 w-3 text-amber-500" /> +{lvl.rewards.coins}
                        <Zap className="h-3 w-3 text-cyan-400 ml-1" /> +{lvl.rewards.xp} XP
                      </span>
                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        ))}

      </div>

      {/* 3. Level Preview & Goal Modal Dialog */}
      {selectedLevel && !activeLevelId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-6 flex flex-col gap-6 relative border-amber-500/20 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-accent-gold">
                  {selectedLevel.type === 'boss' ? <Crown className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Stage {selectedLevel.levelNumber} - {selectedLevel.chapterName}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-100">{selectedLevel.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedLevel(null)}
                className="text-slate-500 hover:text-slate-300 font-bold p-1"
              >
                Close
              </button>
            </div>

            {/* Level Goals & Rewards Breakdown */}
            <div className="flex flex-col gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">Class Level:</span>
                <span className="font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  Class {classLevel} Curriculum
                </span>
              </div>

              {/* Star Criteria */}
              <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Star Goals
                </span>
                <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span>1 Star: Complete the Quest Stage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    </div>
                    <span>2 Stars: Score 70% or higher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    </div>
                    <span>3 Stars: Master with 90%+ Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Target Rewards */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="text-xs font-bold text-slate-400">Stage Rewards:</span>
                <div className="flex items-center gap-3 text-xs font-black">
                  <span className="text-yellow-400 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" /> +{selectedLevel.rewards.xp} XP
                  </span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" /> +{selectedLevel.rewards.coins}
                  </span>
                  {selectedLevel.rewards.gems > 0 && (
                    <span className="text-purple-400 flex items-center gap-1">
                      <Gem className="h-3.5 w-3.5" /> +{selectedLevel.rewards.gems}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Launch Button */}
            <button
              onClick={() => setActiveLevelId(selectedLevel.id)}
              className="btn-gold w-full py-3.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-all"
            >
              <span>Launch Stage {selectedLevel.levelNumber} Quest</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>

          </div>
        </div>
      )}

      {/* 4. Active Phaser 2D Mini-Game Canvas & Checkpoint Engine */}
      {activeLevelId && (
        <GameComponent
          levelId={activeLevelId}
          onClose={() => setActiveLevelId(null)}
          onComplete={handleLevelComplete}
        />
      )}

      {/* 5. Quest Completion Success Dialog Modal */}
      {rewardsEarned && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm glass-card p-8 text-center flex flex-col items-center gap-6 relative border-amber-500/20 shadow-2xl">
            
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-accent-gold shadow-xl">
              <Trophy className="h-10 w-10 animate-bounce-slow" />
            </div>

            {/* Stars Earned Display */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((starNum) => (
                <Star
                  key={starNum}
                  className={`h-7 w-7 ${
                    starNum <= (rewardsEarned.stars || 3)
                      ? 'text-amber-400 fill-amber-400 animate-bounce'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-slate-100">Stage Cleared!</h2>
              <p className="text-xs text-slate-400 font-medium">Class {classLevel} Rewards added to your profile ledger</p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-col items-center gap-1 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">XP</span>
                <span className="font-black text-sm text-yellow-400">+{rewardsEarned.xp || 50}</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Coins</span>
                <div className="flex items-center gap-0.5 text-amber-400 font-black text-sm">
                  <Coins className="h-4 w-4 fill-amber-400" />
                  <span>+{rewardsEarned.coins || 15}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Gems</span>
                <div className="flex items-center gap-0.5 text-purple-400 font-black text-sm">
                  <Gem className="h-4 w-4 fill-purple-400" />
                  <span>+{rewardsEarned.gems || 1}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setRewardsEarned(null)}
              className="btn-gold w-full text-xs py-3.5 font-black uppercase tracking-wider shadow-lg shadow-amber-500/20"
            >
              Continue Adventure
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
