import React from 'react'
import classNames from 'classnames'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  className = '', 
  message = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
    xlarge: 'h-12 w-12'
  }

  const colorClasses = {
    primary: 'border-primary-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }

  const spinnerClasses = classNames(
    'animate-spin rounded-full border-2 border-t-transparent',
    sizeClasses[size],
    colorClasses[color],
    className
  )

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={spinnerClasses}></div>
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner 