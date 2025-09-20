import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Settings from './pages/Settings'
import ComplianceCenter from './pages/ComplianceCenter'
import Navbar from './components/Navbar'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'
import './App.css'

// Layout wrapper to conditionally show navbar
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth()
  
  return (
    <>
      {isAuthenticated && <Navbar />}
      {children}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #fecaca',
              },
            }}
          />
          
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/compliance" element={<ComplianceCenter />} />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
