'use client';

import Lottie from 'lottie-react';
import animationData from '@/lib/preloader-animation.json';

const Preloader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-1/4 h-1/4">
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
};

export default Preloader;
