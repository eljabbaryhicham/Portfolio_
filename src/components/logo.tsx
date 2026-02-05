import Image from 'next/image';
import * as React from 'react';

const Logo = (props: { src?: string; className?: string }) => {
  if (!props.src) return null;
  
  return (
    <Image
      src={props.src}
      alt="site logo"
      width={384}
      height={104}
      className="w-full h-auto"
      priority
    />
  );
};

export default Logo;
