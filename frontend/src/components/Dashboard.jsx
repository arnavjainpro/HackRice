import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button, Alert } from './ui'
import { Pill, Activity, AlertOctagon, AlertTriangle, RefreshCw, Send, Copy, X, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'

// Enhanced Dashboard with RxBridge functionality
const Dashboard = () => {
  const { user, signOut, isAuthenticated, updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' })
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  // RxBridge specific state
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false)
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [isSimulationLoading, setIsSimulationLoading] = useState(false)
  const [selectedDrugForSimulation, setSelectedDrugForSimulation] = useState('')

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Mock pharmacy data
  const [inventoryList, setInventoryList] = useState([
    {
      id: 1,
      drug_name: 'Lisinopril 10mg',
      stock_level: 120,
      avg_daily_use: 15,
      days_of_supply: 8,
      hasAlert: true,
      alertSeverity: 'CRITICAL'
    },
    {
      id: 2,
      drug_name: 'Metformin 500mg',
      stock_level: 450,
      avg_daily_use: 32,
      days_of_supply: 14,
      hasAlert: false
    },
    {
      id: 3,
      drug_name: 'Atorvastatin 20mg',
      stock_level: 89,
      avg_daily_use: 22,
      days_of_supply: 4,
      hasAlert: true,
      alertSeverity: 'AWARENESS'
    },
    {
      id: 4,
      drug_name: 'Amlodipine 5mg',
      stock_level: 256,
      avg_daily_use: 18,
      days_of_supply: 14,
      hasAlert: false
    },
    {
      id: 5,
      drug_name: 'Levothyroxine 50mcg',
      stock_level: 78,
      avg_daily_use: 12,
      days_of_supply: 6,
      hasAlert: true,
      alertSeverity: 'ROUTINE_REORDER'
    }
  ])

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      drug_name: 'Lisinopril 10mg',
      severity: 'CRITICAL',
      description: 'Critical shortage detected - only 8 days remaining',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      drug_name: 'Atorvastatin 20mg',
      severity: 'AWARENESS',
      description: 'Low stock warning - 4 days of supply remaining',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 3,
      drug_name: 'Levothyroxine 50mcg',
      severity: 'ROUTINE_REORDER',
      description: 'Routine reorder suggested based on usage patterns',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
    }
  ])

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

  // RxBridge handlers
  const handleAlertClick = (alert) => {
    setSelectedAlert(alert)
  }

  const handleGenerateCommunication = (drug) => {
    setSelectedDrug(drug)
    setSelectedAlert(null)
    setCommunicationModalOpen(true)
  }

  const handleTriggerShortage = (selectedDrugName) => {
    if (!selectedDrugName) return
    
    setIsSimulationLoading(true)
    
    setTimeout(() => {
      // Create a new alert for the shortage
      const newAlert = {
        id: Date.now(),
        drug_name: selectedDrugName,
        severity: Math.random() > 0.5 ? 'CRITICAL' : 'AWARENESS',
        timestamp: new Date().toISOString(),
        description: `Simulated shortage event triggered for ${selectedDrugName}. Current inventory levels have been reduced.`,
        days_remaining: Math.floor(Math.random() * 5) + 1
      }
      
      // Add the new alert to the alerts array
      setAlerts(prevAlerts => [newAlert, ...prevAlerts])
      
      // Update inventory levels for the selected drug
      setInventoryList(prevInventory => 
        prevInventory.map(item => {
          if (item.drug_name === selectedDrugName) {
            const newStockLevel = Math.max(10, Math.floor(item.stock_level * 0.3)) // Reduce to 30% or minimum 10
            const newDaysOfSupply = Math.floor(newStockLevel / item.avg_daily_use)
            return {
              ...item,
              stock_level: newStockLevel,
              days_of_supply: newDaysOfSupply,
              hasAlert: true,
              alertSeverity: newAlert.severity
            }
          }
          return item
        })
      )
      
      setIsSimulationLoading(false)
      setSelectedDrugForSimulation('')
      toast.success(`Successfully triggered shortage event for ${selectedDrugName}!`)
    }, 2000)
  }

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          borderColor: 'border-l-red-500',
          bgColor: '#fef2f2',
          icon: AlertOctagon,
          iconColor: '#dc2626'
        }
      case 'AWARENESS':
        return {
          borderColor: 'border-l-yellow-500',
          bgColor: '#fffbeb',
          icon: AlertTriangle,
          iconColor: '#d97706'
        }
      case 'ROUTINE_REORDER':
        return {
          borderColor: 'border-l-blue-500',
          bgColor: '#eff6ff',
          icon: RefreshCw,
          iconColor: '#2563eb'
        }
      default:
        return {
          borderColor: 'border-l-slate-500',
          bgColor: '#f8fafc',
          icon: AlertTriangle,
          iconColor: '#64748b'
        }
    }
  }

  const getStockLevelColor = (daysOfSupply) => {
    if (daysOfSupply <= 5) return '#dc2626'
    if (daysOfSupply <= 10) return '#d97706'
    return '#111827'
  }

  const getRowStyle = (item) => {
    if (!item.hasAlert) return { backgroundColor: '#ffffff' }
    
    switch (item.alertSeverity) {
      case 'CRITICAL':
        return { backgroundColor: '#fef2f2' }
      case 'AWARENESS':
        return { backgroundColor: '#fffbeb' }
      case 'ROUTINE_REORDER':
        return { backgroundColor: '#eff6ff' }
      default:
        return { backgroundColor: '#ffffff' }
    }
  }

  return (
    <div className="dashboard">
      <main className="dashboard-content">
        {message.content && (
          <Alert type={message.type} onClose={() => setMessage({ type: '', content: '' })}>
            {message.content}
          </Alert>
        )}

        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Left Column - Inventory Table */}
          <div className="card">
            <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Inventory Overview
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #fecaca' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Drug Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Stock Level</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Avg Daily Use</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Days of Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map((item) => (
                    <tr key={item.id} style={{ ...getRowStyle(item), borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: '#111827', fontWeight: '500' }}>{item.drug_name}</div>
                        {item.hasAlert && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Alert: {item.alertSeverity.replace('_', ' ').toLowerCase()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: getStockLevelColor(item.days_of_supply), fontWeight: item.days_of_supply <= 10 ? 'bold' : 'normal' }}>
                        {item.stock_level} units
                      </td>
                      <td style={{ padding: '1rem', color: '#111827' }}>
                        {item.avg_daily_use} units/day
                      </td>
                      <td style={{ padding: '1rem', color: getStockLevelColor(item.days_of_supply), fontWeight: 'bold' }}>
                        {item.days_of_supply} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Simulation Panel */}
            <div className="card" style={{ border: '2px dashed #fecaca' }}>
              <h2 style={{ color: '#dc2626' }}>🎯 Simulation Panel</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                <strong>For Demo Purposes</strong>
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                  Select Drug to Simulate Shortage
                </label>
                <select
                  value={selectedDrugForSimulation}
                  onChange={(e) => setSelectedDrugForSimulation(e.target.value)}
                  disabled={isSimulationLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#111827',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Choose a drug...</option>
                  {inventoryList.map((item) => (
                    <option key={item.id} value={item.drug_name}>
                      {item.drug_name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                fullWidth
                onClick={() => handleTriggerShortage(selectedDrugForSimulation)}
                disabled={!selectedDrugForSimulation || isSimulationLoading}
                loading={isSimulationLoading}
                style={{ background: '#ea580c', borderColor: '#ea580c', color: '#ffffff' }}
              >
                <Activity style={{ width: '1rem', height: '1rem' }} />
                Trigger Shortage Event
              </Button>
            </div>

            {/* Alert Feed */}
            <div className="card">
              <h2 style={{ color: '#dc2626' }}>🚨 Alert Feed ({alerts.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    <p style={{ color: '#6b7280' }}>No new alerts. All systems normal.</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const config = getSeverityConfig(alert.severity)
                    const IconComponent = config.icon
                    
                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert)}
                        style={{
                          ...getRowStyle({ hasAlert: true, alertSeverity: alert.severity }),
                          border: '1px solid #e5e7eb',
                          borderLeft: `4px solid ${config.iconColor}`,
                          borderRadius: '8px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)'
                          e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <IconComponent style={{ width: '1.25rem', height: '1.25rem', color: config.iconColor, flexShrink: 0, marginTop: '0.125rem' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {alert.drug_name}
                              </h4>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0, marginLeft: '0.5rem' }}>
                                {Math.floor((Date.now() - alert.timestamp) / (1000 * 60 * 60))}h ago
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: '1.4' }}>
                              {alert.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Password Update Section */}
        {showPasswordUpdate && (
          <div className="card" style={{ marginTop: '2rem' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    marginTop: '0.5rem'
                  }}
                />
                <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Must be at least 8 characters long</small>
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
      </main>

      {/* Modals */}
      {selectedAlert && <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} onGenerateCommunication={handleGenerateCommunication} />}
      {communicationModalOpen && <CommunicationModal drug={selectedDrug} onClose={() => { setCommunicationModalOpen(false); setSelectedDrug(null) }} />}
    </div>
  )
}

// Alert Detail Modal Component
const AlertModal = ({ alert, onClose, onGenerateCommunication }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [recommendation, setRecommendation] = useState(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setRecommendation({
        alternative_drug: getAlternativeDrug(alert.drug_name),
        justification: getJustification(alert.drug_name, alert.severity)
      })
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [alert])

  const getAlternativeDrug = (drugName) => {
    const alternatives = {
      'Lisinopril 10mg': 'Enalapril 10mg',
      'Atorvastatin 20mg': 'Simvastatin 20mg',
      'Levothyroxine 50mcg': 'Levothyroxine 25mcg (2 tablets)',
    }
    return alternatives[drugName] || 'Generic Alternative Available'
  }

  const getJustification = (drugName, severity) => {
    if (severity === 'CRITICAL') {
      return `Due to critical shortage of ${drugName}, we recommend immediate substitution. The alternative has identical therapeutic effects with similar dosing profile.`
    } else if (severity === 'AWARENESS') {
      return `Current stock levels are concerning. The suggested alternative provides equivalent therapeutic benefits and is readily available.`
    } else {
      return `Based on usage patterns and supply chain optimization, this alternative offers better availability while maintaining therapeutic equivalence.`
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 50
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 10px 10px -5px rgba(220, 38, 38, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #fecaca' }}>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>
            AI Recommendation for {alert.drug_name}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}>
            <X style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="loading-spinner" style={{ width: '2rem', height: '2rem', margin: '0 auto 1rem', borderTopColor: '#dc2626' }}></div>
                <p style={{ color: '#6b7280' }}>AI is analyzing alternatives...</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1rem' }}>Current Alert</h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151' }}>
                  <strong>Severity:</strong> {alert.severity}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
                  {alert.description}
                </p>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <Lightbulb style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', marginRight: '0.5rem' }} />
                  <h3 style={{ margin: 0, color: '#dc2626', fontSize: '1rem' }}>AI Recommendation</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#dc2626' }}>
                      Suggested Alternative:
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#b91c1c', fontWeight: '600' }}>
                      {recommendation.alternative_drug}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#dc2626' }}>
                      Justification:
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#b91c1c', lineHeight: 1.5 }}>
                      {recommendation.justification}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #fecaca' }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onGenerateCommunication(alert.drug_name)} disabled={isLoading}>
            <Send style={{ width: '1rem', height: '1rem' }} />
            Generate Communication
          </Button>
        </div>
      </div>
    </div>
  )
}

// Communication Modal Component
const CommunicationModal = ({ drug, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [generatedMessage, setGeneratedMessage] = useState('')

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setGeneratedMessage(generateMessage(drug))
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [drug])

  const generateMessage = (drugName) => {
    const currentDate = new Date().toLocaleDateString()
    
    return `Dear Healthcare Provider,

We are writing to inform you of a supply chain disruption affecting ${drugName} that may impact your patients' therapy.

CURRENT SITUATION:
Our pharmacy is experiencing a temporary shortage of ${drugName}. We anticipate this shortage may last 7-10 days based on supplier communications.

RECOMMENDED ACTION:
Our clinical team recommends considering the following therapeutic alternatives for affected patients:

• Alternative medication options are available and clinically appropriate
• No dosage adjustments required for most patients
• Similar efficacy profile with established safety data
• Coverage typically maintained under most insurance plans

NEXT STEPS:
1. Review attached patient list for those currently prescribed ${drugName}
2. Consider alternative therapy as clinically appropriate
3. We will contact patients directly regarding prescription changes
4. Our pharmacists are available for consultation on therapeutic alternatives

We understand this situation may cause inconvenience and appreciate your partnership in maintaining continuity of care for our mutual patients. Please contact our clinical team at (555) 123-4567 if you have questions or need additional information.

Thank you for your understanding and continued collaboration.

Sincerely,
RxBridge Pharmacy Network
Clinical Operations Team

Date: ${currentDate}
Reference: Supply Chain Alert #${Math.floor(Math.random() * 10000)}`
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage)
      toast.success('Message copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast.error('Failed to copy message')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 50
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 10px 10px -5px rgba(220, 38, 38, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #fecaca' }}>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>
            Generated Message to Prescribers
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}>
            <X style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="loading-spinner" style={{ width: '2rem', height: '2rem', margin: '0 auto 1rem', borderTopColor: '#dc2626' }}></div>
                <p style={{ color: '#6b7280' }}>AI is generating communication...</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#dc2626', marginBottom: '0.5rem' }}>
                  Generated Message:
                </label>
                <textarea
                  readOnly
                  value={generatedMessage}
                  style={{
                    width: '100%',
                    height: '400px',
                    padding: '1rem',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #fecaca' }}>
          <Button variant="ghost" onClick={onClose}>
            <X style={{ width: '1rem', height: '1rem' }} />
            Close
          </Button>
          <Button onClick={handleCopyToClipboard} disabled={isLoading} style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}>
            <Copy style={{ width: '1rem', height: '1rem' }} />
            Copy to Clipboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
