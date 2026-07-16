import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { ShieldCheck, Server, ShieldAlert, FileText, Database } from 'lucide-react';

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        <p className="text-slate-400 font-medium">Booting System Command...</p>
      </div>
    );
  }

  const counters = analytics?.counters || { totalUsers: 0, students: 0, teachers: 0, schools: 0 };
  const auditLogs = analytics?.recentAuditLogs || [];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Analytics Counter row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Box 1 */}
        <div className="glass-card p-5 flex items-center gap-4">
          <Server className="h-8 w-8 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Total Accounts</span>
            <span className="font-extrabold text-lg text-slate-200">{counters.totalUsers}</span>
          </div>
        </div>

        {/* Box 2 */}
        <div className="glass-card p-5 flex items-center gap-4">
          <Database className="h-8 w-8 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Students</span>
            <span className="font-extrabold text-lg text-slate-200">{counters.students}</span>
          </div>
        </div>

        {/* Box 3 */}
        <div className="glass-card p-5 flex items-center gap-4">
          <Server className="h-8 w-8 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Instructors</span>
            <span className="font-extrabold text-lg text-slate-200">{counters.teachers}</span>
          </div>
        </div>

        {/* Box 4 */}
        <div className="glass-card p-5 flex items-center gap-4">
          <ShieldCheck className="h-8 w-8 text-red-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Schools</span>
            <span className="font-extrabold text-lg text-slate-200">{counters.schools}</span>
          </div>
        </div>
      </div>

      {/* Audit Log panel */}
      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <FileText className="h-5 w-5 text-amber-500" /> Audit Log System
        </div>

        <div className="flex flex-col gap-3">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No recent logs recorded.</p>
          ) : (
            auditLogs.map((log: any) => (
              <div key={log._id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold">
                    {log.action}
                  </span>
                  <span>System modified by user ID: {log.userId}</span>
                </div>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
