import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ShieldAlert, Compass } from 'lucide-react';

export default function Onboarding() {
  const { user, onboard, error, loading } = useAuthStore();
  const navigate = useNavigate();

  // Student Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classLevel, setClassLevel] = useState(5);
  const [board, setBoard] = useState<'CBSE' | 'ICSE' | 'State'>('CBSE');
  const [langPref, setLangPref] = useState<'en' | 'hi'>('en');
  
  // Parent Fields
  const [parentPhone, setParentPhone] = useState('');
  const [linkingCode, setLinkingCode] = useState('');

  // Teacher Fields
  const [teacherSchoolCode, setTeacherSchoolCode] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<number[]>([]);

  const [validationError, setValidationError] = useState('');

  const handleSubjectToggle = (sub: string) => {
    setTeacherSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleClassToggle = (c: number) => {
    setTeacherClasses((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!firstName || !lastName) {
      setValidationError('First name and Last name are required.');
      return;
    }

    let payload: any = { firstName, lastName };

    if (user?.role === 'Student') {
      payload = {
        ...payload,
        classLevel,
        board,
        languagePreference: langPref,
      };
    } else if (user?.role === 'Parent') {
      if (!parentPhone || !linkingCode) {
        setValidationError('Phone number and Child linking username are required.');
        return;
      }
      payload = {
        ...payload,
        phone: parentPhone,
        studentLinkingCode: linkingCode,
      };
    } else if (user?.role === 'Teacher') {
      if (!teacherSchoolCode || teacherSubjects.length === 0 || teacherClasses.length === 0) {
        setValidationError('School Code, subjects, and classes are required.');
        return;
      }
      payload = {
        ...payload,
        schoolCode: teacherSchoolCode,
        subjects: teacherSubjects,
        classesTaught: teacherClasses,
      };
    }

    const success = await onboard(payload);
    if (success) {
      if (user?.role === 'Student') {
        navigate('/dashboard');
      } else if (user?.role === 'Parent') {
        navigate('/parent/dashboard');
      } else if (user?.role === 'Teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Compass className="h-10 w-10 text-accent-gold" />
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">Setup Profile</h1>
          <p className="text-sm text-slate-400">Customize your LearnQuest interface</p>
        </div>

        {/* Validation Errors */}
        {(validationError || error) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>{validationError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="glass-input"
                placeholder="e.g. Samaksh"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="glass-input"
                placeholder="e.g. Rastogi"
              />
            </div>
          </div>

          {/* Student onboarding */}
          {user?.role === 'Student' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Level</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(parseInt(e.target.value, 10))}
                  className="glass-input cursor-pointer bg-slate-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education Board</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CBSE', 'ICSE', 'State'] as const).map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setBoard(b)}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                        board === b
                          ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLangPref('en')}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      langPref === 'en'
                        ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangPref('hi')}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      langPref === 'hi'
                        ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Parent onboarding */}
          {user?.role === 'Parent' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Phone</label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="glass-input"
                  placeholder="+919876543210"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Child Linking Code (Username)
                </label>
                <input
                  type="text"
                  value={linkingCode}
                  onChange={(e) => setLinkingCode(e.target.value.toLowerCase().trim())}
                  className="glass-input"
                  placeholder="e.g. aarav"
                />
              </div>
            </>
          )}

          {/* Teacher onboarding */}
          {user?.role === 'Teacher' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Code</label>
                <input
                  type="text"
                  value={teacherSchoolCode}
                  onChange={(e) => setTeacherSchoolCode(e.target.value.toUpperCase().trim())}
                  className="glass-input"
                  placeholder="e.g. DPSRKP"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subjects</label>
                <div className="flex gap-2">
                  {['Mathematics', 'Science'].map((s) => {
                    const active = teacherSubjects.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleSubjectToggle(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                          active
                            ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classes Taught</label>
                <div className="flex flex-wrap gap-2">
                  {[5, 6, 7, 8, 9, 10].map((c) => {
                    const active = teacherClasses.includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => handleClassToggle(c)}
                        className={`w-10 h-10 rounded-xl font-bold border flex items-center justify-center transition-all ${
                          active
                            ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-4 font-bold py-3.5 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
            ) : (
              'Unlock Platform'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
