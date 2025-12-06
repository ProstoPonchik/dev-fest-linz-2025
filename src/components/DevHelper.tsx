'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function DevHelper() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold text-yellow-900 mb-1">
            🔧 DEV MODE - Your Tutor ID:
          </p>
          <code className="text-xs bg-white px-2 py-1 rounded block break-all">
            {user.uid}
          </code>
          <p className="text-xs text-yellow-800 mt-2">
            Використай це як <code>tutorId</code> при створенні студента в Firebase
          </p>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-yellow-700 hover:text-yellow-900 text-xl"
          title="Copy to clipboard"
        >
          {copied ? '✅' : '📋'}
        </button>
      </div>
      <details className="mt-3 text-xs text-yellow-900">
        <summary className="cursor-pointer font-semibold">
          Як додати студента? 👇
        </summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          <li>Відкрий Firebase Console</li>
          <li>Firestore Database → Collection &quot;students&quot;</li>
          <li>Add Document з полями:
            <ul className="ml-4 mt-1 space-y-1">
              <li>• tutorId: <code className="bg-white px-1">{user.uid.substring(0, 8)}...</code></li>
              <li>• email: <code className="bg-white px-1">твій-email@gmail.com</code></li>
              <li>• name, age, subject, level, goals...</li>
            </ul>
          </li>
          <li>Студент може увійти: <code className="bg-white px-1">/student/login</code></li>
        </ol>
      </details>
    </div>
  );
}
