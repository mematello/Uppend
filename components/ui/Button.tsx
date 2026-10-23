import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isTouchTarget?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', isTouchTarget = true, className = '', children, ...props },
  ref
) {
  const baseClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const touchClass = isTouchTarget ? 'min-h-[44px]' : '';
  const mergedClassName = `${baseClasses} ${touchClass} ${className}`.trim();

  return (
    <button ref={ref} className={mergedClassName} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
