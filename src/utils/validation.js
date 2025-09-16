// Form validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  const errors = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateForm = (email, password, isSignUp = false) => {
  const errors = {}
  
  if (!email) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (!password) {
    errors.password = 'Password is required'
  } else if (isSignUp) {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0] // Show first error
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
