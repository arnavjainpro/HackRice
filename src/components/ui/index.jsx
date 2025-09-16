import React from 'react'

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  loading = false, 
  disabled = false,
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'btn'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  }
  const sizeClasses = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg'
  }
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'btn-full',
    loading && 'btn-loading',
    disabled && 'btn-disabled'
  ].filter(Boolean).join(' ')
  
  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="loading-spinner"></span>
      ) : children}
    </button>
  )
}

export const Input = ({ 
  label, 
  error, 
  helperText,
  icon,
  ...props 
}) => {
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={props.id} className="input-label">
          {label}
          {props.required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input 
          className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  )
}

export const Alert = ({ type = 'info', children, onClose }) => {
  const typeClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  }
  
  return (
    <div className={`alert ${typeClasses[type]}`}>
      <div className="alert-content">
        {children}
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  )
}
