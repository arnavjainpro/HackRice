import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { validateForm } from '../utils/validation'
import { Button, Input, Alert } from './ui'

const Login = () => {
  const { 
    signIn, 
    signUp, 
    resetPassword,
    isAuthenticated, 
    isSupabaseConfigured,
    loading: authLoading 
  } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password Input Component with visibility toggle
  const PasswordInput = ({ label, name, placeholder, value, onChange, error, helperText, required, disabled, showPassword, onToggleVisibility }) => (
    <div className="input-group">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="password-input-wrapper">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`input password-input ${error ? 'input-error' : ''}`}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            // Eye slash icon (hide)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            // Eye icon (show)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  )

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />
  }

  // Show loading while checking auth state
  if (authLoading) {
    return <div className="loading">Loading...</div>
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', content: '' })

    if (!isSupabaseConfigured) {
      setMessage({
        type: 'error',
        content: 'Authentication service not configured. Please check your environment variables.'
      })
      setLoading(false)
      return
    }

    // Validate form
    const validation = validateForm(formData.email, formData.password, isSignUp)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      setLoading(false)
      return
    }

    // Check password confirmation for sign up
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setFormErrors({ confirmPassword: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      let result
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, {
          data: {
            email_confirm: true
          }
        })
      } else {
        result = await signIn(formData.email, formData.password)
      }

      if (result.error) {
        setMessage({
          type: 'error',
          content: result.error.message
        })
      } else if (isSignUp) {
        setMessage({
          type: 'success',
          content: 'Account created! Please check your email to confirm your account.'
        })
        // Switch to sign in after successful sign up
        setTimeout(() => {
          setIsSignUp(false)
          setMessage({ type: '', content: '' })
        }, 3000)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        content: 'An unexpected error occurred. Please try again.'
      })
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', content: '' })

    if (!formData.email) {
      setFormErrors({ email: 'Please enter your email address' })
      setLoading(false)
      return
    }

    try {
      const { error } = await resetPassword(formData.email)
      if (error) {
        setMessage({
          type: 'error',
          content: error.message
        })
      } else {
        setMessage({
          type: 'success',
          content: 'Password reset email sent! Check your inbox.'
        })
        setShowForgotPassword(false)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        content: 'Failed to send reset email. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setFormErrors({})
    setMessage({ type: '', content: '' })
    setShowForgotPassword(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }))
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to HackRice</h1>
          <p>{isSignUp ? 'Create your account' : 'Sign in to your account'}</p>
        </div>

        {!isSupabaseConfigured && (
          <Alert type="warning">
            <h3>⚠️ Setup Required</h3>
            <p>Authentication service not configured. Please check your environment variables.</p>
          </Alert>
        )}

        {message.content && (
          <Alert type={message.type} onClose={() => setMessage({ type: '', content: '' })}>
            {message.content}
          </Alert>
        )}

        <form onSubmit={showForgotPassword ? handleForgotPassword : handleAuth}>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            required
            disabled={loading}
          />

          {!showForgotPassword && (
            <>
              <PasswordInput
                label="Password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                error={formErrors.password}
                helperText={isSignUp ? "Must be at least 8 characters with uppercase, lowercase, and number" : undefined}
                required
                disabled={loading}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword(!showPassword)}
              />

              {isSignUp && (
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={formErrors.confirmPassword}
                  required
                  disabled={loading}
                  showPassword={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}
            </>
          )}

          <Button 
            type="submit" 
            fullWidth
            loading={loading}
            disabled={!isSupabaseConfigured}
          >
            {showForgotPassword 
              ? 'Send Reset Email'
              : isSignUp 
                ? 'Create Account' 
                : 'Sign In'
            }
          </Button>
        </form>

        <div className="auth-footer">
          {!showForgotPassword && (
            <>
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button 
                  type="button"
                  className="link-button"
                  onClick={toggleMode}
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>

              {!isSignUp && (
                <button 
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading}
                >
                  Forgot your password?
                </button>
              )}
            </>
          )}

          {showForgotPassword && (
            <button 
              type="button"
              className="link-button"
              onClick={() => setShowForgotPassword(false)}
              disabled={loading}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
