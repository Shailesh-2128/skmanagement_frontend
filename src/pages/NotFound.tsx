import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-6xl font-bold text-slate-800">404</h1>
      <p className="text-xl text-slate-600 mt-2">Page Not Found</p>
      <Link to="/" className="mt-6 text-blue-600 hover:text-blue-700 font-semibold">Go to Home</Link>
    </div>
  );
};
export default NotFound;
