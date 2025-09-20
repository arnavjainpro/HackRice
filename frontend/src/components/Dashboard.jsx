import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button, Alert } from './ui'
import { Pill, AlertOctagon, AlertTriangle, RefreshCw, Send, Copy, X, Lightbulb, ShieldAlert } from 'lucide-react'
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
      alertSeverity: 'CRITICAL',
      isRecalled: false
    },
    {
      id: 2,
      drug_name: 'Metformin 500mg',
      stock_level: 450,
      avg_daily_use: 32,
      days_of_supply: 14,
      hasAlert: false,
      isRecalled: false
    },
    {
      id: 3,
      drug_name: 'Atorvastatin 20mg',
      stock_level: 89,
      avg_daily_use: 22,
      days_of_supply: 4,
      hasAlert: true,
      alertSeverity: 'AWARENESS',
      isRecalled: false
    },
    {
      id: 4,
      drug_name: 'Amlodipine 5mg',
      stock_level: 256,
      avg_daily_use: 18,
      days_of_supply: 14,
      hasAlert: false,
      isRecalled: false
    },
    {
      id: 5,
      drug_name: 'Levothyroxine 50mcg',
      stock_level: 78,
      avg_daily_use: 12,
      days_of_supply: 6,
      hasAlert: true,
      alertSeverity: 'ROUTINE_REORDER',
      isRecalled: false
    },
    {
      id: 6,
      drug_name: 'Losartan 50mg',
      stock_level: 240,
      avg_daily_use: 28,
      days_of_supply: 8,
      hasAlert: true,
      alertSeverity: 'CRITICAL',
      isRecalled: true,
      recallInfo: {
        recallDate: '2025-09-15',
        recallReason: 'Potential carcinogen contamination - NDMA impurity detected',
        recallSeverity: 'Class I',
        recallNumber: 'Z-1234-2025',
        fda_url: 'https://www.fda.gov/safety/recalls'
      }
    },
    {
      id: 7,
      drug_name: 'Valsartan 160mg',
      stock_level: 156,
      avg_daily_use: 22,
      days_of_supply: 7,
      hasAlert: true,
      alertSeverity: 'CRITICAL',
      isRecalled: true,
      recallInfo: {
        recallDate: '2025-09-10',
        recallReason: 'Manufacturing defect - incorrect labeling on bottles',
        recallSeverity: 'Class II',
        recallNumber: 'Z-5678-2025',
        fda_url: 'https://www.fda.gov/safety/recalls'
      }
    },
    {
      id: 8,
      drug_name: 'Ranitidine 150mg',
      stock_level: 89,
      avg_daily_use: 15,
      days_of_supply: 6,
      hasAlert: true,
      alertSeverity: 'CRITICAL',
      isRecalled: true,
      recallInfo: {
        recallDate: '2025-09-08',
        recallReason: 'NDMA contamination above acceptable limits',
        recallSeverity: 'Class I',
        recallNumber: 'Z-9012-2025',
        fda_url: 'https://www.fda.gov/safety/recalls'
      }
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
    },
    {
      id: 4,
      drug_name: 'Losartan 50mg',
      severity: 'RECALL',
      description: 'FDA Class I Recall: Potential carcinogen contamination - NDMA impurity detected. Stop dispensing immediately.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      recallNumber: 'Z-1234-2025'
    },
    {
      id: 5,
      drug_name: 'Valsartan 160mg',
      severity: 'RECALL',
      description: 'FDA Class II Recall: Manufacturing defect - incorrect labeling on bottles. Verify all prescriptions.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      recallNumber: 'Z-5678-2025'
    },
    {
      id: 6,
      drug_name: 'Ranitidine 150mg',
      severity: 'RECALL',
      description: 'FDA Class I Recall: NDMA contamination above acceptable limits. Immediate withdrawal required.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      recallNumber: 'Z-9012-2025'
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
      case 'RECALL':
        return {
          borderColor: 'border-l-red-600',
          bgColor: '#fef1f1',
          icon: ShieldAlert,
          iconColor: '#b91c1c'
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
    // Recalled medicines get highest priority styling
    if (item.isRecalled) {
      return { 
        backgroundColor: '#fef1f1',
        borderLeft: '4px solid #dc2626'
      }
    }
    
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

        <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Left Column - Inventory Table */}
          <div className="card">
            <h2 data-icon="📊">Inventory Overview</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Stock Level</th>
                    <th>Avg Daily Use</th>
                    <th>Days of Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map((item) => (
                    <tr key={item.id} style={getRowStyle(item)} className={item.isRecalled ? 'recalled-drug' : ''}>
                      <td>
                        <div className="drug-name">
                          {item.drug_name}
                          {item.isRecalled && (
                            <span className="recall-badge">RECALLED</span>
                          )}
                        </div>
                        {item.hasAlert && (
                          <div className="drug-alert">
                            Alert: {item.alertSeverity.replace('_', ' ')}
                          </div>
                        )}
                        {item.isRecalled && item.recallInfo && (
                          <div className="recall-info">
                            Recall: {item.recallInfo.recallSeverity} - {item.recallInfo.recallReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`stock-level ${item.days_of_supply <= 5 ? 'stock-critical' : item.days_of_supply <= 10 ? 'stock-warning' : 'stock-normal'}`}>
                          {item.stock_level} units
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontWeight: '500' }}>
                        {item.avg_daily_use} units/day
                      </td>
                      <td>
                        <span className={`stock-level ${item.days_of_supply <= 5 ? 'stock-critical' : item.days_of_supply <= 10 ? 'stock-warning' : 'stock-normal'}`}>
                          {item.days_of_supply} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Alert Feed */}
            <div className="card">
              <h2 data-icon="🚨">Alert Feed ({alerts.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>No new alerts. All systems normal.</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const config = getSeverityConfig(alert.severity)
                    const IconComponent = config.icon
                    
                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert)}
                        className={`alert-feed-item ${alert.severity.toLowerCase()}`}
                      >
                        <div className="alert-header">
                          <div className="alert-icon">
                            <IconComponent style={{ width: '1.25rem', height: '1.25rem', color: config.iconColor }} />
                          </div>
                          <div className="alert-content">
                            <h4 className="alert-title">{alert.drug_name}</h4>
                            <p className="alert-description">{alert.description}</p>
                          </div>
                          <span className="alert-time">
                            {Math.floor((Date.now() - alert.timestamp) / (1000 * 60 * 60))}h ago
                          </span>
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
