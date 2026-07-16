import React, { useState } from 'react';
import { api } from '../utils/api';
import { Database, PlusCircle, Sparkles } from 'lucide-react';

export default function AdminCurriculum() {
  const [activeForm, setActiveForm] = useState<'subject' | 'chapter' | 'topic' | 'mission' | 'question'>('subject');

  // Form Fields
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');

  const [chapSubId, setChapSubId] = useState('');
  const [chapName, setChapName] = useState('');
  const [chapSeq, setChapSeq] = useState(1);

  const [topChapId, setTopChapId] = useState('');
  const [topName, setTopName] = useState('');
  const [topSeq, setTopSeq] = useState(1);

  const [misTopId, setMisTopId] = useState('');
  const [misName, setMisName] = useState('');
  const [misSeq, setMisSeq] = useState(1);

  const [qTopId, setQTopId] = useState('');
  const [qText, setQText] = useState('');
  const [qAns, setQAns] = useState('');
  const [qExp, setQExp] = useState('');

  const [loading, setLoading] = useState(false);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subCode.trim()) return;
    setLoading(true);

    try {
      await api.post('/admin/curriculum/subjects', { name: subName, code: subCode });
      alert('Subject created successfully!');
      setSubName('');
      setSubCode('');
    } catch (err) {
      alert('Failed to create Subject.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapSubId.trim() || !chapName.trim()) return;
    setLoading(true);

    try {
      await api.post('/admin/curriculum/chapters', { subjectId: chapSubId, name: chapName, sequence: chapSeq });
      alert('Chapter created successfully!');
      setChapName('');
    } catch (err) {
      alert('Failed to create Chapter.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topChapId.trim() || !topName.trim()) return;
    setLoading(true);

    try {
      await api.post('/admin/curriculum/topics', { chapterId: topChapId, name: topName, sequence: topSeq });
      alert('Topic created successfully!');
      setTopName('');
    } catch (err) {
      alert('Failed to create Topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!misTopId.trim() || !misName.trim()) return;
    setLoading(true);

    try {
      await api.post('/admin/curriculum/missions', { topicId: misTopId, name: misName, sequence: misSeq, type: 'normal' });
      alert('Mission and Level created successfully!');
      setMisName('');
    } catch (err) {
      alert('Failed to create Mission.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTopId.trim() || !qText.trim() || !qAns.trim()) return;
    setLoading(true);

    try {
      await api.post('/admin/curriculum/questions', {
        topicId: qTopId,
        type: 'mcq',
        difficulty: 'easy',
        questionText: qText,
        options: [qAns, 'Incorrect Choice B', 'Incorrect Choice C', 'Incorrect Choice D'], // Simple MCQs mock
        correctAnswer: '0', // Correct is the first index
        explanation: qExp,
      });
      alert('MCQ Question added successfully!');
      setQText('');
      setQAns('');
      setQExp('');
    } catch (err) {
      alert('Failed to create Question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-slate-900/80 to-amber-950/15 border-amber-500/10">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-black font-sans">Curriculum CMS</h1>
            <p className="text-xs text-slate-400">Add or manage school subjects, levels, and question pools</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start">
        {(['subject', 'chapter', 'topic', 'mission', 'question'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveForm(t)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
              activeForm === t
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Add {t}
          </button>
        ))}
      </div>

      {/* Forms Container */}
      <div className="glass-card p-8">
        {activeForm === 'subject' && (
          <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-slate-200">Register New Subject</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Name</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Money Management"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Code</label>
                <input
                  type="text"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value.toLowerCase())}
                  placeholder="e.g. money"
                  className="glass-input py-2 text-xs"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-fit text-xs px-6 py-2.5 mt-2">
              {loading ? 'Creating...' : 'Create Subject'}
            </button>
          </form>
        )}

        {activeForm === 'chapter' && (
          <form onSubmit={handleAddChapter} className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-slate-200">Add Chapter</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject ID Reference</label>
                <input
                  type="text"
                  value={chapSubId}
                  onChange={(e) => setChapSubId(e.target.value)}
                  placeholder="Subject MongoDB ObjectId"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chapter Name</label>
                <input
                  type="text"
                  value={chapName}
                  onChange={(e) => setChapName(e.target.value)}
                  placeholder="e.g. Budgeting Basics"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sequence Order</label>
                <input
                  type="number"
                  value={chapSeq}
                  onChange={(e) => setChapSeq(parseInt(e.target.value, 10))}
                  className="glass-input py-2 text-xs bg-slate-950"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-fit text-xs px-6 py-2.5 mt-2">
              {loading ? 'Creating...' : 'Create Chapter'}
            </button>
          </form>
        )}

        {activeForm === 'topic' && (
          <form onSubmit={handleAddTopic} className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-slate-200">Add Topic</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chapter ID Reference</label>
                <input
                  type="text"
                  value={topChapId}
                  onChange={(e) => setTopChapId(e.target.value)}
                  placeholder="Chapter MongoDB ObjectId"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Topic Name</label>
                <input
                  type="text"
                  value={topName}
                  onChange={(e) => setTopName(e.target.value)}
                  placeholder="e.g. Piggy Banks vs Savings"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sequence Order</label>
                <input
                  type="number"
                  value={topSeq}
                  onChange={(e) => setTopSeq(parseInt(e.target.value, 10))}
                  className="glass-input py-2 text-xs bg-slate-950"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-fit text-xs px-6 py-2.5 mt-2">
              {loading ? 'Creating...' : 'Create Topic'}
            </button>
          </form>
        )}

        {activeForm === 'mission' && (
          <form onSubmit={handleAddMission} className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-slate-200">Add Level / Mission</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Topic ID Reference</label>
                <input
                  type="text"
                  value={misTopId}
                  onChange={(e) => setMisTopId(e.target.value)}
                  placeholder="Topic MongoDB ObjectId"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mission Level Title</label>
                <input
                  type="text"
                  value={misName}
                  onChange={(e) => setMisName(e.target.value)}
                  placeholder="e.g. Save the Coins Stage 1"
                  className="glass-input py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sequence Order</label>
                <input
                  type="number"
                  value={misSeq}
                  onChange={(e) => setMisSeq(parseInt(e.target.value, 10))}
                  className="glass-input py-2 text-xs bg-slate-950"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-fit text-xs px-6 py-2.5 mt-2">
              {loading ? 'Creating...' : 'Create Mission'}
            </button>
          </form>
        )}

        {activeForm === 'question' && (
          <form onSubmit={handleAddQuestion} className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-slate-200">Add MCQ Question to Bank</h3>
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Topic ID Reference</label>
                  <input
                    type="text"
                    value={qTopId}
                    onChange={(e) => setQTopId(e.target.value)}
                    placeholder="Topic MongoDB ObjectId"
                    className="glass-input py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correct Answer Value</label>
                  <input
                    type="text"
                    value={qAns}
                    onChange={(e) => setQAns(e.target.value)}
                    placeholder="Exact correct answer string choice"
                    className="glass-input py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Question Text</label>
                <input
                  type="text"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Which tool do we use to record daily piggy savings?"
                  className="glass-input py-2.5 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">AI Explanation / Hint details</label>
                <textarea
                  value={qExp}
                  onChange={(e) => setQExp(e.target.value)}
                  placeholder="Detailed concept breakdown details..."
                  className="glass-input py-2.5 text-xs h-20 resize-none"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-fit text-xs px-6 py-2.5 mt-2">
              {loading ? 'Adding...' : 'Add Question'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
