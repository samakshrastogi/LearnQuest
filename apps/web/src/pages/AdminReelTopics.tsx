import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { BookOpen, Plus, Trash2, Sparkles, Database, Layers, CheckCircle2, X } from 'lucide-react';

export default function AdminReelTopics() {
  const queryClient = useQueryClient();
  const [topicName, setTopicName] = useState('');
  const [sequence, setSequence] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
        sequence,
      });

      showToast('✨ Topic added with unique serial sequence!');
      setTopicName('');
      setSequence((prev) => prev + 1);
      
      queryClient.invalidateQueries({ queryKey: ['adminAllTopics'] });
      queryClient.invalidateQueries({ queryKey: ['allTopicsList'] });
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
      queryClient.invalidateQueries({ queryKey: ['adminAllTopics'] });
      queryClient.invalidateQueries({ queryKey: ['allTopicsList'] });
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

      {/* Page Header with "Class 1 to 5 Topics" button */}
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
              Add and configure topics with unique serial numbers displayed in the student dropdown
            </p>
          </div>
        </div>

        {/* Class 1 to 5 Topics Modal Launch Button */}
        <button
          onClick={() => setShowModal(true)}
          className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xl shadow-amber-500/10 transform hover:scale-105 transition-all shrink-0"
        >
          <Sparkles className="h-4 w-4 fill-slate-950" />
          <span>Class 1 to 5 Topics</span>
        </button>
      </div>

      {/* Page Hero Card */}
      <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-4 border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
          <BookOpen className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-100">Class 1 to 5 Reel Topics Management Portal</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Click the button below to open the interactive manager modal where you can add new topics with unique serial sequence numbers or delete configured items for student dropdowns.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gold px-6 py-3.5 rounded-2xl text-xs font-black flex items-center gap-2.5 shadow-2xl shadow-amber-500/15 transform hover:scale-105 transition-all mt-2"
        >
          <Sparkles className="h-4 w-4 fill-slate-950" />
          <span>Open Class 1 to 5 Topics Manager</span>
        </button>
      </div>

      {/* Class 1 to 5 Topics Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 flex flex-col gap-6 shadow-2xl relative max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-100">Class 1 to 5 Topics Manager</h2>
                  <p className="text-xs text-slate-400">Add topics and assign unique serial numbers for student dropdowns</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Topic Entry Form */}
            <form onSubmit={handleAddTopic} className="grid sm:grid-cols-12 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="sm:col-span-6 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Topic Name *</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Addition & Subtraction Quests"
                  className="glass-input py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-3 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Serial No. (Seq)</label>
                <input
                  type="number"
                  value={sequence}
                  onChange={(e) => setSequence(parseInt(e.target.value, 10))}
                  className="glass-input py-2 text-xs bg-slate-900"
                />
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={submitting || !topicName.trim()}
                  className="btn-gold w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Topic</span>
                </button>
              </div>
            </form>

            {/* Modal Topics List */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span>Configured Topics ({topics.length})</span>
                <span>Serial No. & Action</span>
              </div>

              {topics.map((t: any, idx: number) => (
                <div
                  key={t._id}
                  className="p-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30">
                      {t.sequence || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{t.name}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteTopic(t._id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete Topic"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
