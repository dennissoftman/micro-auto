import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  optional?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, optional, className = "", ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="text-sm font-medium mb-1.5 block">
            {label}
            {optional && (
              <span className="text-slate-400 font-normal ml-1">
                (optional)
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
            error
              ? "border-red-300 dark:border-red-900 focus:border-red-500"
              : "border-slate-200 dark:border-zinc-800"
          }`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
