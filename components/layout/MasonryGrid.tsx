'use client';

import React from 'react';
import Masonry from 'react-masonry-css';

interface MasonryGridProps {
  children: React.ReactNode;
}

const breakpointColumns = {
  default: 5,
  1600: 4,
  1280: 3,
  850: 2,
  550: 1
};

export function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex -ml-4 w-auto"
      columnClassName="pl-4"
    >
      {children}
    </Masonry>
  );
}
