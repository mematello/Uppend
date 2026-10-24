import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'success' | 'error';
}

const toneStyles: Record<NonNullable<AlertProps['tone']>, string> = {
  default: 'border border-hairline bg-card text-ink',
  success: 'border border-green-700/40 bg-green-700/10 text-ink dark:border-green-500/40 dark:bg-green-950/20',
  error: 'border border-red-700/40 bg-red-700/10 text-ink dark:border-red-500/40 dark:bg-red-950/20',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'default', className = '', children, ...props },
  ref
) {
  const baseClasses = 'rounded-ledger p-4 text-sm';
  const toneClass = toneStyles[tone] || toneStyles.default;
  const mergedClassName = `${baseClasses} ${toneClass} ${className}`.trim();

  return (
    <div ref={ref} className={mergedClassName} {...props}>
      {children}
    </div>
  );
});

Alert.displayName = 'Alert';
