
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface IconProps {
  icon: IconDefinition | React.FC<React.SVGProps<SVGSVGElement>>;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ icon, className }) => {
  if (typeof icon === 'function') {
    const CustomIcon = icon;
    return <CustomIcon className={className} />;
  }
  // It's an IconDefinition
  return <FontAwesomeIcon icon={icon as IconDefinition} className={className} />;
};
