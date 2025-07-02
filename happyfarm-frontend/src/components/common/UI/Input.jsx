import React, { forwardRef } from 'react'
import classNames from 'classnames'

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  labelClassName = '',
  ...props
}, ref) => {
  const inputClasses = classNames(
    'block w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    {
      'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !error,
      'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50': error,
      'bg-gray-50 cursor-not-allowed': disabled,
      'bg-white': !disabled
    },
    className
  )

  const labelClasses = classNames(
    'block text-sm font-medium mb-1',
    {
      'text-gray-700': !error,
      'text-red-700': error
    },
    labelClassName
  )

  return (
    <div className="w-full">
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p 
          id={`${props.id}-error`}
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={`${props.id}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input 