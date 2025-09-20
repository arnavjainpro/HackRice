import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Pill, 
  LogOut, 
  User, 
  Bell, 
  Settings, 
  Activity, 
  ChevronDown,
  Search,
  Shield
} from 'lucide-react'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationCount] = useState(3) // Mock notification count

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      borderBottom: '2px solid #fecaca',
      boxShadow: '0 1px 3px 0 rgba(220, 38, 38, 0.1), 0 1px 2px 0 rgba(220, 38, 38, 0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '0 1.5rem'
    }}>
      <div style={{
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4rem'
      }}>
        {/* Logo and Brand */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <div style={{
            backgroundColor: '#dc2626',
            borderRadius: '8px',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Pill style={{ width: '1.5rem', height: '1.5rem', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
              color: '#dc2626',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              RxBridge
            </h1>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0,
              fontWeight: '500'
            }}>
              AI Pharmacy Supply Chain Assistant
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          flex: 1,
          maxWidth: '400px',
          margin: '0 2rem',
          position: 'relative'
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1rem',
              height: '1rem',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search medications, suppliers, or alerts..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#f9fafb',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#dc2626'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Right Side - Navigation Items */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* System Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#dcfdf7',
            border: '1px solid #6ee7b7',
            borderRadius: '6px'
          }}>
            <Activity style={{ width: '1rem', height: '1rem', color: '#059669' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46' }}>
              System Online
            </span>
          </div>

          {/* Notifications */}
          <button style={{
            position: 'relative',
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <Bell style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
            {notificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: '50%',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '1.25rem'
              }}>
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleDropdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.borderColor = '#dc2626'
              }}
              onMouseLeave={(e) => {
                if (!dropdownOpen) {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.borderColor = '#e5e7eb'
                }
              }}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                backgroundColor: '#dc2626',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User style={{ width: '1rem', height: '1rem', color: '#ffffff' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#111827'
                }}>
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  Pharmacist
                </p>
              </div>
              <ChevronDown style={{
                width: '1rem',
                height: '1rem',
                color: '#6b7280',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: '200px',
                zIndex: 50
              }}>
                <div style={{ padding: '0.5rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #f3f4f6',
                    marginBottom: '0.5rem'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {user?.email}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      Licensed Pharmacist
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/settings')
                      setDropdownOpen(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <Settings style={{ width: '1rem', height: '1rem' }} />
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      navigate('/compliance')
                      setDropdownOpen(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <Shield style={{ width: '1rem', height: '1rem' }} />
                    Compliance Center
                  </button>

                  <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #f3f4f6' }} />

                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <LogOut style={{ width: '1rem', height: '1rem' }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  )
}

export default Navbar