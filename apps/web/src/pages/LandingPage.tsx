import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Trophy, Video, Compass, ChevronRight, Lock, BookOpen } from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. Header Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent tracking-tight font-sans">
            LearnQuest
          </span>
          <span className="bg-amber-500/10 text-accent-gold text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/20">
            India
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-400 hover:text-slate-200 font-semibold transition-all">
            Login
          </Link>
          <Link to="/register" className="btn-gold px-5 py-2 text-sm shadow-md font-bold">
            Sign Up Free
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center justify-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-sans leading-none">
            Game Khelo, Duniya Bachao,{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Aur Padhai Apne Aap Ho Jayegi!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-medium mb-8 max-w-xl mx-auto">
            LearnQuest India merges school syllabus topics (CBSE/ICSE) with side-scrolling RPG adventures, bite-sized reels, and AI tutoring for Class 1-10 students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register" className="btn-gold px-8 py-4 flex items-center gap-2 shadow-xl hover:scale-[1.03] transition-all text-base">
              Start Your Adventure <ChevronRight className="h-5 w-5" />
            </Link>
            <a href="#how-it-works" className="btn-outline px-8 py-4 text-base font-semibold hover:bg-slate-800 transition-all">
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Float background sphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-orange-600/5 rounded-full filter blur-3xl -z-10" />
      </section>

      {/* 3. Features Grid */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 w-full border-t border-slate-900">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-16 tracking-tight">
          How LearnQuest India Reinvents Study
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-8 flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-accent-gold">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">NCERT RPG Worlds</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Explore subject-aligned fantasy realms (Math Kingdom, Science City) in our 2D platformer. Solve checkpoint questions to unlock keys, defeat enemies, and collect crystal shards.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Curriculum Reels</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ditch boring lectures. Watch 60-second animated video concepts mapped to chapters, and answer quick, reward-bearing pop-quizzes at the end of each reel!
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-accent-violet">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">AI Guruji Tutor</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Whenever a student commits an error, Guruji jumps in with step-by-step guidance, hindi templates, and age-appropriate explanations without giving the answers away immediately.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Safe Shield Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full border-t border-slate-900">
        <div className="glass-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-cyan-950/20 border-cyan-500/15">
          <div className="max-w-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm tracking-wider uppercase">
              <Lock className="h-4 w-4" /> Child Safety and Privacy First
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight">COPPA & Indian Privacy Compliant</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We collect minimal personal data. Direct chats are disabled. Clan interactions are pre-moderated with safe emotes. Parents have full dashboards to manage study limits and watch-time statistics.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Shield className="h-28 w-28 text-cyan-500/20 fill-cyan-500/5 animate-pulse" />
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/40 py-8 text-center text-slate-500 text-xs">
        <p>© 2026 LearnQuest India. Built for students, parents, and educators. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
