import React, { useState, useEffect, useRef } from 'react'
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
  Shield,
  Menu,
  X
} from 'lucide-react'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [notificationCount] = useState(3) // Mock notification count
  const userButtonRef = useRef(null)

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const toggleDropdown = (e) => {
    if (!dropdownOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const dropdownWidth = 240
      
      // Calculate position to keep dropdown within viewport
      let rightPosition = windowWidth - rect.right
      if (rightPosition < 16) {
        rightPosition = 16
      }
      
      // Ensure dropdown doesn't go off left edge
      if ((windowWidth - rightPosition - dropdownWidth) < 16) {
        rightPosition = Math.max(16, windowWidth - dropdownWidth - 16)
      }
      
      setDropdownPosition({
        top: rect.bottom + 8,
        right: rightPosition
      })
    }
    setDropdownOpen(!dropdownOpen)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleNavigation = (path) => {
    navigate(path)
    setDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo and Brand */}
          <div className="navbar-brand" onClick={() => handleNavigation('/dashboard')}>
            <div className="brand-icon">
              <Pill style={{ width: '1.5rem', height: '1.5rem', color: '#ffffff' }} />
            </div>
            <div className="brand-text">
              <h1>RxBridge</h1>
              <p>AI Pharmacy Supply Chain Assistant</p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          {!isMobile && (
            <div className="navbar-search">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search medications, suppliers, or alerts..."
                  className="search-input"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="navbar-actions">
              {/* System Status */}
              <div className="system-status">
                <Activity className="status-icon" />
                <span>System Online</span>
              </div>

              {/* Notifications */}
              <button className="notification-btn">
                <Bell className="bell-icon" />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="user-dropdown">
                <button 
                  ref={userButtonRef}
                  className="user-btn" 
                  onClick={toggleDropdown}
                >
                  <div className="user-avatar">
                    <User className="user-icon" />
                  </div>
                  <div className="user-info">
                    <p className="user-name">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="user-role">Pharmacist</p>
                  </div>
                  <ChevronDown className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
                </button>

                {/* Desktop Dropdown Menu */}
                {dropdownOpen && (
                  <div 
                    className="dropdown-menu" 
                    style={{
                      position: 'fixed',
                      top: dropdownPosition.top,
                      right: dropdownPosition.right,
                      zIndex: 9999
                    }}
                  >
                    <div className="dropdown-content">
                      <div className="dropdown-header">
                        <p className="dropdown-email">{user?.email}</p>
                        <p className="dropdown-title">Licensed Pharmacist</p>
                      </div>

                      <button className="dropdown-item" onClick={() => handleNavigation('/settings')}>
                        <Settings className="dropdown-icon" />
                        Settings
                      </button>

                      <button className="dropdown-item" onClick={() => handleNavigation('/compliance')}>
                        <Shield className="dropdown-icon" />
                        Compliance Center
                      </button>

                      <hr className="dropdown-divider" />

                      <button className="dropdown-item danger" onClick={handleSignOut}>
                        <LogOut className="dropdown-icon" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="mobile-controls">
              <button className="notification-btn mobile">
                <Bell className="bell-icon" />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>
              <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Search Bar */}
        {isMobile && (
          <div className="mobile-search">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search medications..."
                className="search-input"
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="mobile-user-info">
                <div className="user-avatar">
                  <User className="user-icon" />
                </div>
                <div>
                  <p className="mobile-user-name">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="mobile-user-email">{user?.email}</p>
                  <p className="mobile-user-role">Licensed Pharmacist</p>
                </div>
              </div>
            </div>

            <div className="mobile-menu-content">
              <div className="system-status mobile">
                <Activity className="status-icon" />
                <span>System Online</span>
              </div>

              <button className="mobile-menu-item" onClick={() => handleNavigation('/dashboard')}>
                <Activity className="menu-item-icon" />
                Dashboard
              </button>

              <button className="mobile-menu-item" onClick={() => handleNavigation('/settings')}>
                <Settings className="menu-item-icon" />
                Settings
              </button>

              <button className="mobile-menu-item" onClick={() => handleNavigation('/compliance')}>
                <Shield className="menu-item-icon" />
                Compliance Center
              </button>

              <hr className="mobile-menu-divider" />

              <button className="mobile-menu-item danger" onClick={handleSignOut}>
                <LogOut className="menu-item-icon" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Click outside to close dropdown */}
      {!isMobile && dropdownOpen && (
        <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />
      )}
    </>
  )
}

export default Navbar