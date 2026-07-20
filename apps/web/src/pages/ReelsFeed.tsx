import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { 
  Heart, 
  ThumbsDown, 
  Bookmark, 
  Share2, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Layers, 
  BookOpen, 
  Plus, 
  X, 
  ShieldAlert,
  FileVideo
} from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function ReelsFeed() {
  const { updateWallet } = useAuthStore();

  // Filter states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  
  // Reels Player states
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Upload Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadClassLevel, setUploadClassLevel] = useState(5);
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadChapterId, setUploadChapterId] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Quiz Overlay states
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<any[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCompletedReward, setQuizCompletedReward] = useState<any | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // 1. Fetch Subjects list
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data.data;
    },
  });

  // 2. Fetch Chapters for selected Subject
  const { data: chapters = [] } = useQuery({
    queryKey: ['chaptersList', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      const res = await api.get(`/curriculum/subjects/${selectedSubjectId}/chapters`);
      return res.data.data;
    },
    enabled: !!selectedSubjectId,
  });

  // 3. Fetch Topics for selected Chapter
  const { data: topics = [] } = useQuery({
    queryKey: ['topicsList', selectedChapterId],
    queryFn: async () => {
      if (!selectedChapterId) return [];
      const res = await api.get(`/curriculum/chapters/${selectedChapterId}/topics`);
      return res.data.data;
    },
    enabled: !!selectedChapterId,
  });

  // 4. Fetch Reels Feed based on filters
  const { data: reelsList = [], isLoading, refetch } = useQuery({
    queryKey: ['reelsFeed', selectedSubjectId, selectedChapterId, selectedTopicId],
    queryFn: async () => {
      const params: any = {};
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      if (selectedChapterId) params.chapterId = selectedChapterId;
      if (selectedTopicId) params.topicId = selectedTopicId;

      const res = await api.get('/reels/feed', { params });
      return res.data.data;
    },
  });

  // Automatically select first subject/chapter if not selected
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0]._id);
      setUploadSubjectId(subjects[0]._id);
    }
  }, [subjects]);

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0]._id);
      setUploadChapterId(chapters[0]._id);
    }
  }, [chapters]);

  // Handle Likes
  const handleLike = async (reelId: string) => {
    try {
      await api.post('/reels/like', { reelId });
      refetch();
    } catch (err) {
      // Ignored
    }
  };

  // Handle Dislikes
  const handleDislike = async (reelId: string) => {
    try {
      await api.post('/reels/dislike', { reelId });
      refetch();
    } catch (err) {
      // Ignored
    }
  };

  // Handle Save
  const handleSave = async (reelId: string) => {
    try {
      await api.post('/reels/save', { reelId });
      refetch();
    } catch (err) {
      // Ignored
    }
  };

  // Handle Share link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  // Upload Reel Form Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!uploadTitle || !uploadSubjectId || !uploadChapterId) {
      setUploadError('Title, Subject, and Chapter are required.');
      return;
    }
    if (!uploadFile) {
      setUploadError('Please select a video file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('classLevel', String(uploadClassLevel));
    formData.append('subjectId', uploadSubjectId);
    formData.append('chapterId', uploadChapterId);
    if (uploadTopicId) formData.append('topicId', uploadTopicId);

    try {
      await api.post('/reels/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploading(false);
      setUploadSuccess(true);
      refetch();
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
      }, 1500);
    } catch (err: any) {
      setUploading(false);
      setUploadError(err.response?.data?.message || 'Failed to upload video reel.');
    }
  };

  // Quiz Overlay logic
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
    if (!activeQuizQuestions || reelsList.length === 0) return;
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

  const activeReel = reelsList[activeReelIndex] || null;
  const interaction = activeReel?.userInteraction || { liked: false, disliked: false, saved: false, quizCompleted: false };

  // Resolve backend static video URL vs relative path
  const getFullVideoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${serverOrigin}${url}`;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4 md:p-6 relative">
      
      {/* 1. Top Bar Controls: Subject Dropdown, Chapter Dropdown, Upload Reel Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        
        {/* Left: Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Layers className="h-4 w-4 text-amber-500 shrink-0" />
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId('');
                setSelectedTopicId('');
                setActiveReelIndex(0);
              }}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer pr-2"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Subjects</option>
              {subjects.map((s: any) => (
                <option key={s._id} value={s._id} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <BookOpen className="h-4 w-4 text-cyan-400 shrink-0" />
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setSelectedTopicId('');
                setActiveReelIndex(0);
              }}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer pr-2"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Chapters</option>
              {chapters.map((c: any) => (
                <option key={c._id} value={c._id} className="bg-slate-900 text-slate-200">
                  Ch {c.sequence}: {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Upload Reel Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-gold px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/10 transform hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Upload Reel</span>
        </button>
      </div>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>Reel link copied to clipboard!</span>
        </div>
      )}

      {/* 2. Main Content Grid: Left Topic Sidebar + Right Portrait Reels Player */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Topic Sidebar List */}
        <div className="md:col-span-4 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-gold" />
              Chapter Topics
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
              {topics.length} Topics
            </span>
          </div>

          {topics.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">
              Select a chapter to view its syllabus topic list.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setSelectedTopicId('');
                  setActiveReelIndex(0);
                }}
                className={`p-3 rounded-2xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                  !selectedTopicId
                    ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>All Chapter Topics</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              {topics.map((t: any, idx: number) => (
                <button
                  key={t._id}
                  onClick={() => {
                    setSelectedTopicId(t._id);
                    setActiveReelIndex(0);
                  }}
                  className={`p-3 rounded-2xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                    selectedTopicId === t._id
                      ? 'bg-amber-500/15 border-accent-gold text-accent-gold shadow-md'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="line-clamp-1">{t.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Portrait Reels Player Viewport */}
        <div className="md:col-span-8 flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
              <p className="text-slate-400 font-medium text-xs">Loading Reels...</p>
            </div>
          ) : !activeReel ? (
            <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full">
              <FileVideo className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No Video Reels for Selected Topic</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Click "Upload Reel" in the top right to submit a video for this subject chapter!
              </p>
            </div>
          ) : (
            <div className="w-full max-w-[360px] flex flex-col gap-4 relative">
              
              {/* Feed Counter */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-extrabold uppercase text-slate-300">
                  {activeReel.subjectId?.name || 'Curriculum'} Reel
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2.5 py-1 rounded-full border border-slate-700">
                  {activeReelIndex + 1} / {reelsList.length}
                </span>
              </div>

              {/* 9:16 Portrait Smartphone Frame Container */}
              <div 
                onContextMenu={(e) => e.preventDefault()}
                className="glass-card relative aspect-[9/16] bg-slate-950 overflow-hidden shadow-2xl border-slate-800/90 rounded-3xl flex flex-col justify-between p-5 select-none"
              >
                
                {/* 100% SECURE VIDEO PLAYER WITH DOWNLOAD PREVENTION */}
                {activeReel.videoUrl ? (
                  <video
                    src={getFullVideoUrl(activeReel.videoUrl)}
                    poster={activeReel.thumbnailUrl}
                    autoPlay={isPlaying}
                    loop
                    muted={isMuted}
                    controlsList="nodownload no-remote-playback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl pointer-events-auto"
                    onClick={() => setIsPlaying(!isPlaying)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                    <Play className="h-16 w-16 text-cyan-500/20 fill-cyan-500/5 animate-pulse" />
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest mt-2 uppercase">
                      NO VIDEO ATTACHED
                    </span>
                  </div>
                )}

                {/* Top Overlay Bar */}
                <div className="flex items-center justify-between w-full z-20 pointer-events-none">
                  <span className="text-[10px] bg-slate-950/70 backdrop-blur-md text-amber-400 font-extrabold px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest">
                    CLASS {activeReel.classLevel}
                  </span>
                  
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-800 text-slate-200 pointer-events-auto hover:bg-slate-900"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>

                {/* Middle Play/Pause Overlay Indicator */}
                {!isPlaying && (
                  <div 
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700 flex items-center justify-center z-20 cursor-pointer text-amber-500"
                  >
                    <Play className="h-8 w-8 ml-1 fill-amber-500" />
                  </div>
                )}

                {/* Floating Side Action Panel (Like, Dislike, Share, Save) */}
                <div className="absolute right-3 bottom-24 flex flex-col gap-4 z-20">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(activeReel._id)}
                    className="flex flex-col items-center gap-1 group focus:outline-none"
                  >
                    <div className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                      interaction.liked 
                        ? 'bg-red-500/20 border-red-500/40 text-red-500 scale-110 shadow-lg shadow-red-500/20'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 group-hover:text-slate-100'
                    }`}>
                      <Heart className={`h-5 w-5 ${interaction.liked ? 'fill-red-500' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black text-slate-200 shadow-sm">{activeReel.likesCount || 0}</span>
                  </button>

                  {/* Dislike Button */}
                  <button
                    onClick={() => handleDislike(activeReel._id)}
                    className="flex flex-col items-center gap-1 group focus:outline-none"
                  >
                    <div className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                      interaction.disliked 
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 scale-110'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 group-hover:text-slate-100'
                    }`}>
                      <ThumbsDown className={`h-5 w-5 ${interaction.disliked ? 'fill-cyan-400' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black text-slate-200 shadow-sm">{activeReel.dislikesCount || 0}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center gap-1 group focus:outline-none"
                  >
                    <div className="p-3 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300 group-hover:text-slate-100 backdrop-blur-md">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-slate-200">Share</span>
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave(activeReel._id)}
                    className="flex flex-col items-center gap-1 group focus:outline-none"
                  >
                    <div className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                      interaction.saved
                        ? 'bg-amber-500/20 border-accent-gold text-accent-gold scale-110'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 group-hover:text-slate-100'
                    }`}>
                      <Bookmark className={`h-5 w-5 ${interaction.saved ? 'fill-accent-gold' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black text-slate-200">Save</span>
                  </button>
                </div>

                {/* Bottom Video Details Overlay */}
                <div className="mt-auto flex flex-col gap-3 z-20 w-[80%] bg-slate-950/80 p-3 rounded-2xl border border-slate-800/60 backdrop-blur-md">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-extrabold text-sm text-slate-100 line-clamp-1">{activeReel.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{activeReel.description}</p>
                  </div>

                  {/* Quiz Trigger Button */}
                  {activeReel.quizQuestions && activeReel.quizQuestions.length > 0 && (
                    <div>
                      {interaction.quizCompleted ? (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Quiz Completed!
                        </div>
                      ) : (
                        <button
                          onClick={() => startQuiz(activeReel.quizQuestions)}
                          className="btn-cyan w-full text-xs py-2 flex items-center justify-center gap-1.5 font-bold"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Start Video Quiz
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Feed Navigation Buttons */}
              <div className="flex gap-2 w-full">
                <button
                  disabled={activeReelIndex === 0}
                  onClick={() => {
                    setActiveReelIndex((i) => i - 1);
                    setIsPlaying(true);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs py-3 rounded-xl disabled:opacity-40 font-bold"
                >
                  Previous Reel
                </button>
                <button
                  disabled={activeReelIndex === reelsList.length - 1}
                  onClick={() => {
                    setActiveReelIndex((i) => i + 1);
                    setIsPlaying(true);
                  }}
                  className="flex-1 btn-gold py-3 text-xs flex items-center justify-center gap-1 font-bold"
                >
                  Next Reel <ChevronRight className="h-4 w-4 text-slate-950" />
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 3. Upload Reel Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card p-6 flex flex-col gap-5 relative border-slate-800">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-accent-gold font-extrabold text-sm uppercase tracking-wide">
                <Upload className="h-4 w-4" /> Upload Educational Reel
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess ? (
              <div className="text-center py-8 flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
                <h3 className="font-bold text-slate-200 text-base">Reel Uploaded Successfully!</h3>
                <p className="text-xs text-slate-400">Your video is now available in the curriculum feed.</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 text-xs">
                
                {/* File picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase">Video File (MP4 / WebM)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="glass-input file:bg-slate-800 file:text-slate-300 file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:mr-3 file:font-bold file:text-xs"
                  />
                </div>

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase">Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Fractions Explained in 60 Seconds"
                    className="glass-input"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Short description of the lesson..."
                    className="glass-input"
                  />
                </div>

                {/* Grid for Class Level, Subject, Chapter */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-400 uppercase">Class Level</label>
                    <select
                      value={uploadClassLevel}
                      onChange={(e) => setUploadClassLevel(Number(e.target.value))}
                      className="glass-input bg-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-400 uppercase">Subject</label>
                    <select
                      value={uploadSubjectId}
                      onChange={(e) => {
                        setUploadSubjectId(e.target.value);
                        setUploadChapterId('');
                      }}
                      className="glass-input bg-slate-900"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-400 uppercase">Chapter</label>
                    <select
                      value={uploadChapterId}
                      onChange={(e) => setUploadChapterId(e.target.value)}
                      className="glass-input bg-slate-900"
                    >
                      <option value="">Select Chapter</option>
                      {chapters.map((c: any) => (
                        <option key={c._id} value={c._id}>Ch {c.sequence}: {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-400 uppercase">Topic (Optional)</label>
                    <select
                      value={uploadTopicId}
                      onChange={(e) => setUploadTopicId(e.target.value)}
                      className="glass-input bg-slate-900"
                    >
                      <option value="">Select Topic</option>
                      {topics.map((t: any) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-gold w-full py-3 font-bold mt-2 flex items-center justify-center gap-2"
                >
                  {uploading ? 'Uploading Video Reel...' : 'Publish Video Reel'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
