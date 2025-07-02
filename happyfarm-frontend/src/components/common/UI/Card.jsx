import React from 'react'
import classNames from 'classnames'

const Card = ({
  children,
  title,
  subtitle,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  padding = 'default',
  shadow = 'default',
  border = true,
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    default: 'p-6',
    large: 'p-8'
  }

  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    default: 'shadow-md',
    large: 'shadow-lg'
  }

  const cardClasses = classNames(
    'bg-white rounded-lg transition-shadow duration-200',
    shadowClasses[shadow],
    {
      'border border-gray-200': border,
      [paddingClasses[padding]]: !title
    },
    className
  )

  const headerClasses = classNames(
    'border-b border-gray-200 pb-4 mb-4',
    headerClassName
  )

  const bodyClasses = classNames(
    {
      [paddingClasses[padding]]: title
    },
    bodyClassName
  )

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle) && (
        <div className={`${paddingClasses[padding]} ${headerClasses}`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={bodyClasses}>
        {children}
      </div>
    </div>
  )
}

export default Card 