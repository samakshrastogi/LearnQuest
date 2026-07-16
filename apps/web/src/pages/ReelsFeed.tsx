import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Play, Heart, Bookmark, AlertCircle, Compass, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function ReelsFeed() {
  const { t } = useTranslation();
  const { updateWallet } = useAuthStore();

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  
  // Quiz Overlay states
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<any[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCompletedReward, setQuizCompletedReward] = useState<any | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Fetch reels feed
  const { data: reelsList, isLoading, error, refetch } = useQuery({
    queryKey: ['reelsFeed'],
    queryFn: async () => {
      const res = await api.get('/reels/feed');
      return res.data.data;
    },
  });

  const handleLike = async (reelId: string) => {
    try {
      await api.post('/reels/like', { reelId });
      refetch();
    } catch (err) {
      // Ignored
    }
  };

  const handleSave = async (reelId: string) => {
    try {
      await api.post('/reels/save', { reelId });
      refetch();
    } catch (err) {
      // Ignored
    }
  };

  const startQuiz = (questions: any[]) => {
    setActiveQuizQuestions(questions);
    setQuizAnswers({});
    setQuizCompletedReward(null);
  };

  const handleSelectQuizOption = (qId: string, optIdx: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizQuestions || !reelsList) return;
    setQuizSubmitting(true);

    const activeReel = reelsList[activeReelIndex];
    const answersPayload = activeQuizQuestions.map((q) => ({
      questionId: q._id,
      selectedAnswer: quizAnswers[q._id] || '0',
    }));

    try {
      const res = await api.post('/reels/quiz/submit', {
        reelId: activeReel._id,
        answers: answersPayload,
      });

      const { rewards, wallet } = res.data.data;
      updateWallet(wallet);
      setQuizCompletedReward(rewards);
      setQuizSubmitting(false);
      refetch();
    } catch (err) {
      setQuizSubmitting(false);
      alert('Failed to submit reel quiz answers.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Buffering Reels...</p>
      </div>
    );
  }

  if (error || !reelsList || reelsList.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto mt-10">
        <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">No Video Reels Available</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Verify that the DB seeder has loaded reels video metadata properly for your class level.
        </p>
      </div>
    );
  }

  const activeReel = reelsList[activeReelIndex];
  const interaction = activeReel.userInteraction || { liked: false, saved: false, quizCompleted: false };

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 relative">
      
      {/* 1. Header category indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
          <Compass className="h-4 w-4 text-cyan-400" />
          {activeReel.subjectId?.name || 'Science'} Reel
        </div>

        <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-700/50">
          {activeReelIndex + 1} / {reelsList.length}
        </span>
      </div>

      {/* 2. Reels Player Card */}
      <div className="glass-card relative aspect-[9/16] bg-slate-950 overflow-hidden shadow-2xl border-slate-800/80 rounded-3xl flex flex-col justify-between p-6">
        {/* Dynamic Video placeholder grid */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 bg-slate-900">
          <Play className="h-16 w-16 text-cyan-500/20 fill-cyan-500/5 animate-pulse" />
          <span className="text-[10px] text-slate-600 font-bold tracking-widest mt-2 uppercase">
            PLAYBACK LOOP SIMULATION
          </span>
        </div>

        {/* Top bar info */}
        <div className="flex items-center justify-between w-full z-10">
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-extrabold px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-widest">
            QUIZ GRANTED: +5 COINS
          </span>
        </div>

        {/* Floating Side action buttons (Duolingo/TikTok style) */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-5 z-10">
          {/* Like */}
          <button
            onClick={() => handleLike(activeReel._id)}
            className="flex flex-col items-center gap-1 group focus:outline-none"
          >
            <div className={`p-3 rounded-full backdrop-blur-md border transition-all ${
              interaction.liked 
                ? 'bg-red-500/15 border-red-500/30 text-red-500'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 group-hover:text-slate-100'
            }`}>
              <Heart className={`h-5 w-5 ${interaction.liked ? 'fill-red-500' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{activeReel.likesCount}</span>
          </button>

          {/* Save */}
          <button
            onClick={() => handleSave(activeReel._id)}
            className="flex flex-col items-center gap-1 group focus:outline-none"
          >
            <div className={`p-3 rounded-full backdrop-blur-md border transition-all ${
              interaction.saved
                ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 group-hover:text-slate-100'
            }`}>
              <Bookmark className={`h-5 w-5 ${interaction.saved ? 'fill-accent-gold' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">Save</span>
          </button>
        </div>

        {/* Bottom details Overlay */}
        <div className="mt-auto flex flex-col gap-4 z-10 w-[80%]">
          <div className="flex flex-col gap-1">
            <h3 className="font-extrabold text-sm text-slate-100">{activeReel.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{activeReel.description}</p>
          </div>

          {/* Quiz activator button */}
          {activeReel.quizQuestions && activeReel.quizQuestions.length > 0 && (
            <div>
              {interaction.quizCompleted ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 text-accent-emerald text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" /> Quiz Completed!
                </div>
              ) : (
                <button
                  onClick={() => startQuiz(activeReel.quizQuestions)}
                  className="btn-cyan w-full text-xs py-3 flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Start Video Quiz
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Feed Navigation buttons */}
      <div className="flex gap-2 w-full mt-2">
        <button
          disabled={activeReelIndex === 0}
          onClick={() => setActiveReelIndex((i) => i - 1)}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs py-3 rounded-xl disabled:opacity-40"
        >
          Previous Reel
        </button>
        <button
          disabled={activeReelIndex === reelsList.length - 1}
          onClick={() => setActiveReelIndex((i) => i + 1)}
          className="flex-1 btn-gold hover:scale-100 py-3 text-xs flex items-center justify-center gap-1"
        >
          Next Reel <ChevronRight className="h-4 w-4 text-slate-950" />
        </button>
      </div>

      {/* 4. Quiz Dialog Modal */}
      {activeQuizQuestions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-card p-6 flex flex-col gap-6 relative border-slate-800">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 text-accent-gold font-extrabold text-sm tracking-wide uppercase">
                <Sparkles className="h-4 w-4" /> Reel Checkpoint Quiz
              </div>
              <button
                onClick={() => setActiveQuizQuestions(null)}
                className="text-slate-500 hover:text-slate-300 font-bold"
              >
                Close
              </button>
            </div>

            {quizCompletedReward ? (
              <div className="text-center flex flex-col items-center gap-4 py-4">
                <CheckCircle2 className="h-12 w-12 text-accent-emerald animate-bounce-slow" />
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-black text-lg text-slate-200">Reel Quiz Cleared!</h3>
                  <p className="text-xs text-slate-400">Coins credited successfully</p>
                </div>
                <button
                  onClick={() => {
                    setActiveQuizQuestions(null);
                    setQuizCompletedReward(null);
                  }}
                  className="btn-gold px-6 py-2.5 text-xs font-bold"
                >
                  Return to Feed
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {activeQuizQuestions.map((q, idx) => {
                  const selectedIdx = quizAnswers[q._id];
                  return (
                    <div key={q._id} className="flex flex-col gap-3">
                      <h4 className="font-bold text-xs text-slate-200 leading-relaxed">
                        Q{idx + 1}: {q.questionText}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizOption(q._id, String(optIdx))}
                            className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all ${
                              selectedIdx === String(optIdx)
                                ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                                : 'border-slate-850 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={quizSubmitting || Object.keys(quizAnswers).length < activeQuizQuestions.length}
                  className="btn-gold w-full py-3.5 flex items-center justify-center font-bold"
                >
                  {quizSubmitting ? 'Evaluating...' : 'Submit Answers'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
