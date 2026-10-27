import React from 'react';
import { Panel } from '../ui/Panel';
import { Button, ButtonProps } from '../ui/Button';

export interface SettingsSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsSection({ id, eyebrow, title, description, children }: SettingsSectionProps) {
  return (
    <Panel id={id} role="region" aria-labelledby={`${id}-title`} className="scroll-mt-6 p-5">
      <header className="pb-4 border-b border-hairline">
        <p className="font-label text-xs uppercase tracking-widest text-muted-ink">{eyebrow}</p>
        <h2 id={`${id}-title`} className="font-display text-2xl font-normal text-ink mt-0.5">{title}</h2>
        <p className="text-sm text-muted-ink mt-0.5">{description}</p>
      </header>
      {children}
    </Panel>
  );
}

export interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="mt-5">
      <h3 className="font-label text-xs uppercase tracking-wider text-muted-ink">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export interface SettingsRowProps {
  htmlFor?: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function SettingsRow({ htmlFor, label, hint, children }: SettingsRowProps) {
  return (
    <div className="grid gap-1.5 py-3.5 border-t border-hairline first:border-t-0 first:pt-1 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-x-6 sm:items-start">
      <div>
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block font-medium text-ink">
            {label}
          </label>
        ) : (
          <span className="block font-medium text-ink">{label}</span>
        )}
        {hint && <p className="text-sm text-muted-ink mt-0.5">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export interface SettingsFooterProps {
  status?: string | null;
  isError?: boolean;
  children: React.ReactNode;
}

export function SettingsFooter({ status, isError, children }: SettingsFooterProps) {
  return (
    <div className="mt-1 pt-3.5 border-t border-hairline grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <p
        role="status"
        className={`text-sm sm:min-h-5 sm:order-1 ${isError ? 'text-red-700 dark:text-red-400' : 'text-ink'}`}
      >
        {status}
      </p>
      <div className="sm:order-2">{children}</div>
    </div>
  );
}

export const SettingsSaveButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function SettingsSaveButton({ className = '', variant = 'primary', ...props }, ref) {
    const mergedClassName = `w-full sm:w-auto sm:min-w-[176px] disabled:opacity-40 disabled:cursor-not-allowed ${className}`.trim();
    return <Button ref={ref} variant={variant} className={mergedClassName} {...props} />;
  }
);

SettingsSaveButton.displayName = 'SettingsSaveButton';
