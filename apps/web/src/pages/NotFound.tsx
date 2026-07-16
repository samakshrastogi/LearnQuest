import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="h-16 w-16 text-yellow-500 mb-4 animate-bounce" />
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">Stage Not Found</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
        The map chapter or portal page you tried to access does not exist or has been locked by Shadow Zero.
      </p>
      <Link to="/" className="btn-gold text-xs px-6 py-2.5">
        Return to Landing
      </Link>
    </div>
  );
}
