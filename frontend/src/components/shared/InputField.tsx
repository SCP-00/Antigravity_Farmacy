import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

// ── InputError ────────────────────────────────────────────────

export function InputError({ error, id }: { error?: string; id?: string }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-red-600 mt-1.5 animate-fade-in">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      <span>{error}</span>
    </p>
  )
}

// ── InputField (text/email/number/password) ───────────────────

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  touched?: boolean
  required?: boolean
  helperText?: string
}

export function InputField({ label, error, touched, required, helperText, className = '', id, ...props }: InputFieldProps) {
  const fieldId = id || props.name || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = `${fieldId}-error`
  const hasError = touched && !!error

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-dark-text/80 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={fieldId}
        className={`w-full px-3.5 py-2 border rounded-lg outline-none transition-all text-sm
          ${hasError
            ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/30 focus:border-red-500'
            : 'border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800/30 focus:border-teal-500 dark:focus:border-teal-400'
          }
          bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-dark-surface/50
          ${className}`}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      {helperText && !hasError && (
        <p className="text-xs text-gray-400 dark:text-dark-text/40 mt-1">{helperText}</p>
      )}
      <InputError error={hasError ? error : undefined} id={errorId} />
    </div>
  )
}

// ── SelectField ───────────────────────────────────────────────

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  touched?: boolean
  required?: boolean
  children: ReactNode
  placeholder?: string
}

export function SelectField({ label, error, touched, required, children, placeholder, className = '', id, ...props }: SelectFieldProps) {
  const fieldId = id || props.name || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = `${fieldId}-error`
  const hasError = touched && !!error

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-dark-text/80 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={fieldId}
        className={`w-full px-3.5 py-2 border rounded-lg outline-none transition-all text-sm bg-white dark:bg-dark-surface
          ${hasError
            ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/30 focus:border-red-500'
            : 'border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800/30 focus:border-teal-500 dark:focus:border-teal-400'
          }
          text-gray-900 dark:text-dark-text
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <InputError error={hasError ? error : undefined} id={errorId} />
    </div>
  )
}

// ── TextAreaField ─────────────────────────────────────────────

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
}

export function TextAreaField({ label, error, touched, required, className = '', id, ...props }: TextAreaFieldProps) {
  const fieldId = id || props.name || `field-${Math.random().toString(36).slice(2, 8)}`
  const errorId = `${fieldId}-error`
  const hasError = touched && !!error

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-dark-text/80 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        className={`w-full px-3.5 py-2 border rounded-lg outline-none transition-all text-sm resize-none
          ${hasError
            ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/30 focus:border-red-500'
            : 'border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800/30 focus:border-teal-500 dark:focus:border-teal-400'
          }
          bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      <InputError error={hasError ? error : undefined} id={errorId} />
    </div>
  )
}
