import React from 'react';

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
  className?: string;
  hideActionsOnMobile?: boolean;
}

export function PageHeader({ eyebrow, title, actions, className = '', hideActionsOnMobile = false }: PageHeaderProps) {
  const actionsClass = hideActionsOnMobile
    ? "hidden sm:flex flex-wrap items-center gap-3 sm:w-auto"
    : "flex flex-wrap items-center gap-3 w-full sm:w-auto";

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4 mb-8 ${className}`.trim()}>
      <div>
        <div className="font-label text-xs uppercase tracking-widest text-muted-ink mb-1">
          {eyebrow}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">
          {title}
        </h1>
      </div>
      {actions && (
        <div className={actionsClass}>
          {actions}
        </div>
      )}
    </div>
  );
}
