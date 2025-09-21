import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import InventoryScanTable from './InventoryScanTable'
import './Dashboard.css'

// Enhanced Dashboard with RxBridge compliance scan functionality
const Dashboard = () => {
  const { isAuthenticated } = useAuth()

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>RxBridge Dashboard</h1>
          <p>Comprehensive Inventory Compliance & FDA Recall Management</p>
        </div>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-content-wrapper">
          <InventoryScanTable />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
