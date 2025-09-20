import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui'
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Database,
  Key,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertCircle,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, isAuthenticated, updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    license: 'RPH123456',
    pharmacy: 'RxBridge Pharmacy Network'
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: true,
    criticalOnly: false,
    dailyReports: true,
    weeklyReports: false
  })

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  const handleProfileSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      await updatePassword(passwordData.newPassword)
      toast.success('Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Notification preferences updated!')
    } catch (error) {
      toast.error('Failed to update notifications')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database }
  ]

  return (
    <div style={{
      width: '100%',
      padding: '2rem',
      backgroundColor: '#f9fafb',
      minHeight: 'calc(100vh - 4rem)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 0.5rem 0'
          }}>
            Settings
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Manage your account settings and preferences
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '2rem'
        }} className="settings-grid">
          {/* Sidebar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #fecaca',
            height: 'fit-content'
          }} className="settings-sidebar">
            <nav>
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: activeTab === tab.id ? '#fef2f2' : 'transparent',
                      border: activeTab === tab.id ? '1px solid #fecaca' : '1px solid transparent',
                      borderRadius: '8px',
                      color: activeTab === tab.id ? '#dc2626' : '#374151',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: activeTab === tab.id ? '500' : '400',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <IconComponent style={{ width: '1rem', height: '1rem' }} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #fecaca'
          }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>
                  Profile Information
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1.5rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Pharmacy License
                    </label>
                    <input
                      type="text"
                      value={profileData.license}
                      onChange={(e) => setProfileData({...profileData, license: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Pharmacy Name
                    </label>
                    <input
                      type="text"
                      value={profileData.pharmacy}
                      onChange={(e) => setProfileData({...profileData, pharmacy: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <Button onClick={handleProfileSave} loading={loading}>
                    <Save style={{ width: '1rem', height: '1rem' }} />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>
                  Security Settings
                </h2>
                
                <form onSubmit={handlePasswordUpdate}>
                  <div style={{
                    display: 'grid',
                    gap: '1.5rem',
                    maxWidth: '400px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{
                    marginTop: '2rem'
                  }}>
                    <Button type="submit" loading={loading}>
                      <Key style={{ width: '1rem', height: '1rem' }} />
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>
                  Notification Preferences
                </h2>
                
                <div style={{
                  display: 'grid',
                  gap: '1.5rem'
                }}>
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <h3 style={{
                          margin: '0 0 0.25rem 0',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827'
                        }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {key === 'emailAlerts' && 'Receive email notifications for inventory alerts'}
                          {key === 'smsAlerts' && 'Receive SMS notifications for critical alerts'}
                          {key === 'criticalOnly' && 'Only receive notifications for critical alerts'}
                          {key === 'dailyReports' && 'Daily inventory and supply chain reports'}
                          {key === 'weeklyReports' && 'Weekly analytics and performance reports'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          [key]: e.target.checked
                        })}
                        style={{
                          width: '1rem',
                          height: '1rem',
                          accentColor: '#dc2626'
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <Button onClick={handleNotificationSave} loading={loading}>
                    <Save style={{ width: '1rem', height: '1rem' }} />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 1.5rem 0'
                }}>
                  System Information
                </h2>
                
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>Version:</span>
                    <span style={{ color: '#6b7280' }}>RxBridge v2.1.0</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>Last Updated:</span>
                    <span style={{ color: '#6b7280' }}>September 20, 2025</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>Database Status:</span>
                    <span style={{ 
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Check style={{ width: '1rem', height: '1rem' }} />
                      Connected
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>API Status:</span>
                    <span style={{ 
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Check style={{ width: '1rem', height: '1rem' }} />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings