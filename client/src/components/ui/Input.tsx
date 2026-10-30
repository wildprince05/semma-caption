import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-heading font-bold text-sm text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2.5 font-body text-sm text-ink bg-white
          border-2 border-ink
          focus:outline-none focus:ring-2 focus:ring-yello focus:ring-offset-0
          placeholder:text-ink/40
          disabled:bg-yello-pale disabled:opacity-60 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-xs text-ink/60 font-body">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, hint, className = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-heading font-bold text-sm text-ink">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full px-3 py-2.5 font-body text-sm text-ink bg-white
          border-2 border-ink resize-y min-h-[80px]
          focus:outline-none focus:ring-2 focus:ring-yello focus:ring-offset-0
          placeholder:text-ink/40
          disabled:bg-yello-pale disabled:opacity-60 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-xs text-ink/60 font-body">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
    </div>
  );
};

export default Input;
