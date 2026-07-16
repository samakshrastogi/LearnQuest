import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Users, Award, ShieldCheck, Clock, BrainCircuit } from 'lucide-react';

export default function ParentDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [screenLimit, setScreenLimit] = useState(60);
  const [savingLimit, setSavingLimit] = useState(false);

  // Fetch linked children list
  const { data: childrenList, isLoading: childrenLoading } = useQuery({
    queryKey: ['parentChildren'],
    queryFn: async () => {
      const res = await api.get('/parent/children');
      return res.data.data;
    },
  });

  // Set default child on load
  React.useEffect(() => {
    if (childrenList && childrenList.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenList[0]._id);
    }
  }, [childrenList, selectedChildId]);

  // Fetch progress for selected child
  const { data: childProgress, isLoading: progressLoading, refetch } = useQuery({
    queryKey: ['childProgress', selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return null;
      const res = await api.get(`/parent/children/${selectedChildId}/progress`);
      return res.data.data;
    },
    enabled: !!selectedChildId,
  });

  // Synchronize screen limit slider on progress load
  React.useEffect(() => {
    if (childProgress) {
      setScreenLimit(childProgress.screenTimeLimitMinutes);
    }
  }, [childProgress]);

  const handleUpdateLimit = async () => {
    if (!selectedChildId) return;
    setSavingLimit(true);
    try {
      await api.post('/parent/limits', {
        childId: selectedChildId,
        limitMinutes: screenLimit,
      });
      alert('Screen-time limits locked successfully.');
      refetch();
    } catch (err) {
      alert('Failed to update screen time limits.');
    } finally {
      setSavingLimit(false);
    }
  };

  if (childrenLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
        <p className="text-slate-400 font-medium">Opening Parent Portal...</p>
      </div>
    );
  }

  // Mock charts details
  const studyActivity = [
    { day: 'Mon', minutes: 12 },
    { day: 'Tue', minutes: 20 },
    { day: 'Wed', minutes: 8 },
    { day: 'Thu', minutes: 25 },
    { day: 'Fri', minutes: 15 },
    { day: 'Sat', minutes: 30 },
    { day: 'Sun', minutes: 18 },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Child selector list */}
      <div className="glass-card p-6 flex flex-col gap-4 border-cyan-500/10">
        <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs tracking-wider uppercase">
          <Users className="h-4 w-4" /> Linked Students
        </div>
        <div className="flex gap-3">
          {childrenList?.map((child: any) => (
            <button
              key={child._id}
              onClick={() => setSelectedChildId(child._id)}
              className={`px-6 py-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all ${
                selectedChildId === child._id
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400 shadow-md'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800'
              }`}
            >
              👦 {child.firstName} {child.lastName}
            </button>
          ))}
        </div>
      </div>

      {progressLoading ? (
        <div className="text-center py-10 text-xs text-slate-500">Retrieving student telemetry logs...</div>
      ) : !childProgress ? (
        <div className="text-center py-10">No Linked Child Data Found.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left panel: stats, charts, limits */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Screen-Time controls */}
            <div className="glass-card p-6 flex flex-col gap-4 border-cyan-500/10 bg-gradient-to-r from-slate-900/80 to-cyan-950/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400 animate-pulse" />
                  <h3 className="font-bold">Restricted Study Hours</h3>
                </div>
                <span className="text-xs font-black text-cyan-400">{screenLimit} Mins / Day</span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={screenLimit}
                  onChange={(e) => setScreenLimit(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-400 bg-slate-950 h-2 rounded-lg appearance-none cursor-pointer"
                />
                <button
                  onClick={handleUpdateLimit}
                  disabled={savingLimit}
                  className="btn-cyan text-xs py-2 px-5 font-bold shrink-0 shadow-md"
                >
                  {savingLimit ? 'Saving...' : 'Lock Limit'}
                </button>
              </div>
            </div>

            {/* Study Time Chart */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold">Student Screen Time Split</h3>
              </div>
              <div className="h-52 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studyActivity}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="minutes" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right panel: weak/strong topics */}
          <div className="flex flex-col gap-6">
            
            {/* Weak topics alert list */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs tracking-wider uppercase">
                <ShieldAlert className="h-5 w-5" /> Weak Subject Areas
              </div>
              
              {childProgress.weakTopics.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No weak topic warnings flagged.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {childProgress.weakTopics.map((wt: any) => (
                    <div key={wt._id} className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-slate-200">{wt.topicId?.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase font-medium">{wt.topicId?.chapterId?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strong topics badges */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs tracking-wider uppercase">
                <Award className="h-5 w-5" /> Mastery Achievements
              </div>

              {childProgress.strongTopics.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No masteries above 80% achieved yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {childProgress.strongTopics.map((st: any) => (
                    <div key={st._id} className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-slate-200">{st.topicId?.name}</span>
                      <span className="text-[9px] text-emerald-500 font-bold uppercase">Accuracy: {st.masteryScore}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
