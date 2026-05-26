import React from 'react';
import { Link } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-4xl font-bold text-red-600">Unauthorized</h1>
      <p className="text-lg text-slate-600 mt-2">You do not have permission to view this page.</p>
      <Link to="/" className="mt-6 text-blue-600 hover:text-blue-700 font-semibold">Go to Home</Link>
    </div>
  );
};
export default Unauthorized;
