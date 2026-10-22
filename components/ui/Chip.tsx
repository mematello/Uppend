import React from 'react';

export type ChipProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Chip component renders status and metadata tags.
 * Note: Chip does NOT stop event propagation itself; interactive child elements
 * or callers must handle propagation explicitly where needed.
 */
export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(function Chip(
  { className = '', children, ...props },
  ref
) {
  const baseClasses = 'font-label text-xs uppercase tracking-wider px-2 py-0.5 rounded-ledger inline-flex items-center';
  const mergedClassName = `${baseClasses} ${className}`.trim();

  return (
    <div ref={ref} className={mergedClassName} {...props}>
      {children}
    </div>
  );
});

Chip.displayName = 'Chip';
