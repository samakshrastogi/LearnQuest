import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { GraduationCap, Users, Calendar, Plus, PlusCircle, AlertCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  
  // Assignment Form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignType, setAssignType] = useState<'mission' | 'quiz' | 'worksheet'>('mission');
  const [refId, setRefId] = useState('');

  const [assigning, setAssigning] = useState(false);

  // Fetch classes list
  const { data: classrooms, isLoading: classLoading } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: async () => {
      const res = await api.get('/teachers/classes');
      return res.data.data;
    },
  });

  // Set default class on load
  React.useEffect(() => {
    if (classrooms && classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0]._id);
    }
  }, [classrooms, selectedClassroomId]);

  // Fetch report for selected classroom
  const { data: classroomReport, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['classroomReport', selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return null;
      const res = await api.get(`/teachers/classes/${selectedClassroomId}/report`);
      return res.data.data;
    },
    enabled: !!selectedClassroomId,
  });

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !selectedClassroomId) return;
    setAssigning(true);

    try {
      // Find Math Subject Id for default assignment mapping
      const subRes = await api.get('/curriculum/subjects');
      const subjectId = subRes.data.data[0]?._id;

      await api.post('/teachers/assignments', {
        classRoomId: selectedClassroomId,
        title,
        description: desc,
        subjectId,
        dueDate: new Date(dueDate).toISOString(),
        type: assignType,
        referenceId: refId || 'default_ref',
      });

      alert('Assignment posted successfully to students!');
      setShowAssignForm(false);
      setTitle('');
      setDesc('');
      setDueDate('');
      setRefId('');
    } catch (err) {
      alert('Failed to post assignment.');
    } finally {
      setAssigning(false);
    }
  };

  if (classLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
        <p className="text-slate-400 font-medium">Opening Teacher Lounge...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Selector and Actions row */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-400" />
          <span className="font-extrabold text-sm text-slate-300">Classroom:</span>
          
          <select
            value={selectedClassroomId || ''}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
          >
            {classrooms?.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="btn-cyan bg-gradient-to-r from-emerald-500 to-teal-600 border-none text-slate-950 font-extrabold text-xs py-2 px-5 flex items-center gap-1.5"
        >
          <PlusCircle className="h-4 w-4" /> Issue Homework
        </button>
      </div>

      {showAssignForm && (
        <form onSubmit={handleCreateAssignment} className="glass-card p-6 flex flex-col gap-4 border-emerald-500/10">
          <h3 className="font-bold text-sm text-slate-200">Create New Homework Assignment</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Assignment Title</label>
              <input
                type="text"
                placeholder="e.g. Solve level 5 math"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input py-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="glass-input py-2 text-xs bg-slate-950 text-slate-400"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Task Type</label>
              <select
                value={assignType}
                onChange={(e: any) => setAssignType(e.target.value)}
                className="glass-input py-2 text-xs bg-slate-950 text-slate-400 cursor-pointer"
              >
                <option value="mission">Clear Adventure Mission</option>
                <option value="quiz">Clear Reel Quiz</option>
                <option value="worksheet">Custom Worksheet PDF</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Task Reference (Mission ID/Reel ID/PDF URL)</label>
              <input
                type="text"
                placeholder="e.g. default_ref"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                className="glass-input py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
            <button
              type="button"
              onClick={() => setShowAssignForm(false)}
              className="btn-outline py-2 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning}
              className="btn-cyan py-2 px-6 text-xs bg-emerald-500 text-slate-950 font-bold border-none"
            >
              {assigning ? 'Posting...' : 'Post Assignment'}
            </button>
          </div>
        </form>
      )}

      {/* Classroom report table roster */}
      {reportLoading ? (
        <div className="text-center py-10 text-xs text-slate-500">Calculating student averages...</div>
      ) : !classroomReport || classroomReport.students.length === 0 ? (
        <div className="text-center p-12 glass-card border-slate-800">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-350">No Students Linked</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Share the School Invitation Code with parents to register student profiles.
          </p>
        </div>
      ) : (
        <div className="glass-card p-6 flex flex-col gap-4">
          <h3 className="font-extrabold text-sm text-slate-200">Roster and Analytics</h3>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold">
                  <th className="pb-3 pr-4">STUDENT NAME</th>
                  <th className="pb-3 pr-4">TOTAL XP</th>
                  <th className="pb-3 pr-4 text-center">AVERAGE TOPIC MASTERY</th>
                  <th className="pb-3 text-center">GURUJI ALERTS (WEAK TOPICS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {classroomReport.students.map((student: any) => (
                  <tr key={student.id} className="text-slate-300">
                    <td className="py-4 font-bold pr-4">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-4 pr-4 font-semibold text-slate-400">{student.xp} XP</td>
                    <td className="py-4 pr-4 text-center font-extrabold text-emerald-400">{student.averageMastery}%</td>
                    <td className="py-4 text-center">
                      {student.weakTopicsCount > 0 ? (
                        <span className="bg-red-500/10 text-red-400 font-bold border border-red-500/20 rounded px-2.5 py-1">
                          {student.weakTopicsCount} alerts
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
