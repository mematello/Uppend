import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant: 'input';
  icon?: React.ReactNode;
  aiSuggested?: boolean;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant: 'select';
  tone?: 'default' | 'chip';
  wrapperClassName?: string;
  aiSuggested?: boolean;
}

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant: 'textarea';
  aiSuggested?: boolean;
}

export type FieldProps = InputFieldProps | SelectFieldProps | TextAreaFieldProps;

export const Field = React.forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, FieldProps>(
  function Field(props, ref) {
    if (props.variant === 'input') {
      const { icon, aiSuggested, className = '', ...rest } = props;
      // Exclude custom variant/aiSuggested props from native input
      const inputProps = { ...rest };
      delete (inputProps as Record<string, unknown>).variant;
      delete (inputProps as Record<string, unknown>).aiSuggested;

      const aiClass = aiSuggested ? 'ai-suggested' : '';

      if (icon) {
        return (
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-ink">
              {icon}
            </div>
            <input
              ref={ref as React.ForwardedRef<HTMLInputElement>}
              className={`pl-9 pr-4 py-2 w-full rounded-ledger border border-field-border bg-card text-base sm:text-sm text-ink placeholder:text-muted-ink focus-ink transition-colors ${aiClass} ${className}`.trim()}
              {...inputProps}
            />
          </div>
        );
      }
      return (
        <input
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          className={`px-4 py-2 w-full rounded-ledger border border-field-border bg-card text-base sm:text-sm text-ink placeholder:text-muted-ink focus-ink transition-colors ${aiClass} ${className}`.trim()}
          {...inputProps}
        />
      );
    }

    if (props.variant === 'textarea') {
      const { aiSuggested, className = '', ...rest } = props;
      const textareaProps = { ...rest };
      delete (textareaProps as Record<string, unknown>).variant;
      delete (textareaProps as Record<string, unknown>).aiSuggested;

      const aiClass = aiSuggested ? 'ai-suggested' : '';

      return (
        <textarea
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          className={`px-4 py-2 w-full rounded-ledger border border-field-border bg-card text-base sm:text-sm text-ink placeholder:text-muted-ink focus-ink transition-colors ${aiClass} ${className}`.trim()}
          {...textareaProps}
        />
      );
    }

    // variant === 'select'
    const { tone = 'default', wrapperClassName = '', aiSuggested, className = '', children, ...rest } = props;
    const selectProps = { ...rest };
    delete (selectProps as Record<string, unknown>).variant;
    delete (selectProps as Record<string, unknown>).wrapperClassName;
    delete (selectProps as Record<string, unknown>).aiSuggested;

    const aiClass = aiSuggested ? 'ai-suggested' : '';

    if (tone === 'chip') {
      const resolvedWrapper = wrapperClassName || 'inline-flex';
      return (
        <div className={`relative items-center focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${resolvedWrapper}`.trim()}>
          <select
            ref={ref as React.ForwardedRef<HTMLSelectElement>}
            className={`bg-transparent appearance-none border-none cursor-pointer pl-2.5 pr-7 py-1 text-inherit font-label uppercase text-base sm:text-xs tracking-wider [&>option]:bg-card [&>option]:text-ink ${aiClass} ${className}`.trim()}
            {...selectProps}
          >
            {children}
          </select>
          <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current" />
        </div>
      );
    }

    const resolvedWrapper = wrapperClassName || 'w-full';
    return (
      <div className={`relative inline-block ${resolvedWrapper}`.trim()}>
        <select
          ref={ref as React.ForwardedRef<HTMLSelectElement>}
          className={`appearance-none pr-8 pl-3 py-2 w-full rounded-ledger border border-field-border bg-card text-base sm:text-sm text-ink focus-ink transition-colors cursor-pointer ${aiClass} ${className}`.trim()}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 text-muted-ink pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
      </div>
    );
  }
);

Field.displayName = 'Field';
