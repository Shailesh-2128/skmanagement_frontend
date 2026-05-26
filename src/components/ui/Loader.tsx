import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="loader">
        <span className="loader-text">loading</span>
        <span className="load"></span>
      </div>
    </div>
  );
};

export default Loader;
