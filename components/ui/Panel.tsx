import React from 'react';

export type PanelProps = React.HTMLAttributes<HTMLDivElement>;

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { className = '', children, ...props },
  ref
) {
  const mergedClassName = `bg-card border border-hairline rounded-ledger ${className}`.trim();

  return (
    <div ref={ref} className={mergedClassName} {...props}>
      {children}
    </div>
  );
});

Panel.displayName = 'Panel';
