'use client';

import React from 'react';
import Masonry from 'react-masonry-css';

interface MasonryGridProps {
  children: React.ReactNode;
}

const breakpointColumns = {
  default: 4,
  1400: 3,
  900: 2,
  600: 1
};

export function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex -ml-6 w-auto"
      columnClassName="pl-6"
    >
      {children}
    </Masonry>
  );
}
