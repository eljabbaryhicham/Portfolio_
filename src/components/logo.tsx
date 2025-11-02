import Image from 'next/image';
import * as React from 'react';

const Logo = (props: { src?: string; className?: string }) => (
    <Image
      src={props.src || "https://i.imgur.com/N9c8oEJ.png"}
      alt="belofted logo"
      width={384}
      height={104}
      className="w-full h-auto"
      priority
    />
);

export default Logo;
