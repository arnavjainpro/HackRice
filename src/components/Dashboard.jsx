import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button, Alert } from './ui'

const Dashboard = () => {
  const { user, signOut, isAuthenticated, updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' })
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await signOut()
      if (error) {
        setMessage({
          type: 'error',
          content: 'Failed to sign out. Please try again.'
        })
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updatePassword(newPassword)
      if (error) {
        setMessage({
          type: 'error',
          content: error.message
        })
      } else {
        setMessage({
          type: 'success',
          content: 'Password updated successfully!'
        })
        setNewPassword('')
        setShowPasswordUpdate(false)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        content: 'Failed to update password. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome to HackRice! 🚀</h1>
          <p>You're successfully authenticated and ready to build amazing things.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => setShowPasswordUpdate(!showPasswordUpdate)}>
            Change Password
          </Button>
          <Button variant="danger" onClick={handleSignOut} loading={loading}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="dashboard-content">
        {message.content && (
          <Alert type={message.type} onClose={() => setMessage({ type: '', content: '' })}>
            {message.content}
          </Alert>
        )}

        <div className="dashboard-grid">
          <div className="card">
            <h2>👤 Profile Information</h2>
            <div className="profile-info">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Email Verified:</strong> {user?.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Last Sign In:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
              <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          {showPasswordUpdate && (
            <div className="card">
              <h2>🔒 Change Password</h2>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password:</label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="8"
                  />
                  <small>Must be at least 8 characters long</small>
                </div>
                <div className="form-actions">
                  <Button type="submit" loading={loading} disabled={!newPassword}>
                    Update Password
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowPasswordUpdate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
