'use client'

import React from 'react'

// Text/Number Input
interface InputFieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'email' | 'tel' | 'date'
  placeholder?: string
  required?: boolean
  suffix?: string  // e.g. "€" or "%"
  prefix?: string  // e.g. "€"
  className?: string
  hint?: string
  min?: number
  max?: number
  step?: number
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  suffix,
  prefix,
  className = '',
  hint,
  min,
  max,
  step,
}: InputFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-ink-600 uppercase tracking-wide">
        {label}{required && <span className="text-neg-600 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-ink-400 text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`
            w-full h-10 rounded-lg border border-ink-100 bg-surface-1
            text-ink-800 text-sm
            transition-colors duration-150
            focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100
            placeholder:text-ink-400
            ${prefix ? 'pl-8' : 'pl-3'}
            ${suffix ? 'pr-10' : 'pr-3'}
          `}
        />
        {suffix && (
          <span className="absolute right-3 text-ink-400 text-sm pointer-events-none">{suffix}</span>
        )}
      </div>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

// Select Field
interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  className?: string
  hint?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  required,
  className = '',
  hint,
}: SelectFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-ink-600 uppercase tracking-wide">
        {label}{required && <span className="text-neg-600 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full h-10 rounded-lg border border-ink-100 bg-surface-1
          text-ink-800 text-sm px-3
          transition-colors duration-150
          focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100
          appearance-none cursor-pointer
          ${!value ? 'text-ink-400' : ''}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

// Textarea Field
interface TextareaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  hint?: string
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  hint,
}: TextareaFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-ink-600 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full rounded-lg border border-ink-100 bg-surface-1
          text-ink-800 text-sm px-3 py-2.5
          transition-colors duration-150
          focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100
          placeholder:text-ink-400 resize-none
        `}
      />
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

// Toggle/Checkbox
interface ToggleFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
  className?: string
}

export function ToggleField({ label, checked, onChange, hint, className = '' }: ToggleFieldProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div>
        <p className="text-sm text-ink-800">{label}</p>
        {hint && <p className="text-xs text-ink-400">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none
          ${checked ? 'bg-gold-500' : 'bg-ink-200'}
        `}
      >
        <span className={`
          absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}
        `} />
      </button>
    </div>
  )
}

// Number Input with +/- buttons (for small counts like nombre d'enfants)
interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function NumberStepper({ label, value, onChange, min = 0, max = 20, className = '' }: NumberStepperProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-ink-600 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg border border-ink-100 bg-surface-1 text-ink-600 flex items-center justify-center hover:bg-surface-2 transition-colors text-lg font-light"
        >
          −
        </button>
        <span className="text-ink-800 font-medium text-lg w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg border border-ink-100 bg-surface-1 text-ink-600 flex items-center justify-center hover:bg-surface-2 transition-colors text-lg font-light"
        >
          +
        </button>
      </div>
    </div>
  )
}
