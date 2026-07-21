import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { BookOpen, Plus, Trash2, Sparkles, Database, Layers, CheckCircle2 } from 'lucide-react';

export default function AdminReelTopics() {
  const [topicName, setTopicName] = useState('');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [chapterName, setChapterName] = useState('Chapter 1');
  const [classLevel, setClassLevel] = useState(5);
  const [description, setDescription] = useState('');
  const [sequence, setSequence] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch all existing topics
  const { data: topics = [], refetch, isLoading } = useQuery({
    queryKey: ['adminAllTopics'],
    queryFn: async () => {
      const res = await api.get('/curriculum/all-topics');
      return res.data.data;
    },
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    setSubmitting(true);

    try {
      await api.post('/admin/curriculum/topics', {
        name: topicName.trim(),
        subjectName,
        chapterName,
        classLevel,
        description,
        sequence,
      });

      showToast('✨ Topic added successfully for Class 1-5 dropdown!');
      setTopicName('');
      setDescription('');
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add topic.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to remove this topic from the list?')) return;
    try {
      await api.delete(`/admin/curriculum/topics/${topicId}`);
      showToast('Topic deleted successfully');
      refetch();
    } catch (err: any) {
      alert('Failed to delete topic');
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-4 md:p-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100 font-sans flex items-center gap-2">
              Class 1–5 Reel Topics Manager
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20 uppercase">
                Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Add and configure topics displayed in the single dropdown for Class 1 to 5 students
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Add Topic Form + Topics Table */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Add New Topic */}
        <div className="md:col-span-5 glass-card p-6 flex flex-col gap-4 border-slate-800">
          <div className="flex items-center gap-2 text-slate-200 font-extrabold text-sm border-b border-slate-800 pb-3">
            <Plus className="h-4 w-4 text-amber-400" />
            Add New Reel Topic
          </div>

          <form onSubmit={handleAddTopic} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Topic Name *</label>
              <input
                type="text"
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Addition & Subtraction Quests"
                className="glass-input py-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Class (1-5)</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(parseInt(e.target.value, 10))}
                  className="glass-input py-2 text-xs bg-slate-950"
                >
                  <option value={1}>Class 1</option>
                  <option value={2}>Class 2</option>
                  <option value={3}>Class 3</option>
                  <option value={4}>Class 4</option>
                  <option value={5}>Class 5</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="glass-input py-2 text-xs bg-slate-950"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="General Knowledge">General Knowledge</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chapter Name</label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g. Numbers & Arithmetic"
                  className="glass-input py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sequence Order</label>
                <input
                  type="number"
                  value={sequence}
                  onChange={(e) => setSequence(parseInt(e.target.value, 10))}
                  className="glass-input py-2 text-xs bg-slate-950"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Topic Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of learning goals..."
                className="glass-input py-2 text-xs h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !topicName.trim()}
              className="btn-gold py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 fill-slate-950" />
              <span>{submitting ? 'Adding Topic...' : 'Add Topic to Class 1-5 List'}</span>
            </button>
          </form>
        </div>

        {/* Right Table: List of Topics */}
        <div className="md:col-span-7 glass-card p-6 flex flex-col gap-4 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Configured Dropdown Topics ({topics.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="text-center p-8 text-xs text-slate-500 italic">No topics configured yet. Add one above!</div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[550px] overflow-y-auto pr-1">
              {topics.map((t: any) => (
                <div
                  key={t._id}
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-100">{t.name}</span>
                      {t.chapterId?.subjectId?.name && (
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
                          {t.chapterId.subjectId.name}
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-[11px] text-slate-400 leading-tight">{t.description}</p>}
                  </div>

                  <button
                    onClick={() => handleDeleteTopic(t._id)}
                    className="p-2 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 rounded-xl transition-all shrink-0"
                    title="Delete Topic"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
