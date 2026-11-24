import React from 'react';

export default function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-[#c5a880] border-r-transparent ${sizeClasses[size] || sizeClasses.md}`} />
  );
}
