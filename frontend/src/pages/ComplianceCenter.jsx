import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui'
import InventoryScanTable from '../components/InventoryScanTable'
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'

const ComplianceCenter = () => {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Mock compliance data
  const complianceStats = {
    overallScore: 94,
    totalAudits: 12,
    passedAudits: 11,
    pendingItems: 3,
    lastAudit: '2025-09-15'
  }

  const recentAudits = [
    {
      id: 1,
      title: 'FDA Drug Safety Audit',
      date: '2025-09-15',
      status: 'passed',
      score: 96,
      auditor: 'FDA Regional Office'
    },
    {
      id: 2,
      title: 'DEA Controlled Substances',
      date: '2025-09-10',
      status: 'passed',
      score: 98,
      auditor: 'DEA Inspector Johnson'
    },
    {
      id: 3,
      title: 'State Board Inspection',
      date: '2025-09-05',
      status: 'pending',
      score: null,
      auditor: 'State Board of Pharmacy'
    }
  ]

  const complianceItems = [
    {
      id: 1,
      title: 'Temperature Monitoring Logs',
      description: 'Daily temperature logs for refrigerated medications',
      status: 'compliant',
      dueDate: '2025-09-25',
      category: 'Storage'
    },
    {
      id: 2,
      title: 'Controlled Substance Inventory',
      description: 'Quarterly controlled substance count verification',
      status: 'attention',
      dueDate: '2025-09-22',
      category: 'DEA'
    },
    {
      id: 3,
      title: 'Staff Training Records',
      description: 'Annual pharmacy staff training documentation',
      status: 'compliant',
      dueDate: '2025-10-01',
      category: 'Training'
    },
    {
      id: 4,
      title: 'Prescription Record Review',
      description: 'Monthly prescription dispensing record audit',
      status: 'overdue',
      dueDate: '2025-09-18',
      category: 'Records'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
      case 'passed':
        return '#059669'
      case 'attention':
      case 'pending':
        return '#d97706'
      case 'overdue':
      case 'failed':
        return '#dc2626'
      default:
        return '#6b7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant':
      case 'passed':
        return CheckCircle
      case 'attention':
      case 'pending':
        return Clock
      case 'overdue':
      case 'failed':
        return AlertTriangle
      default:
        return Shield
    }
  }

  const handleDownloadReport = async (auditId) => {
    setLoading(true)
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Compliance report downloaded successfully!')
    } catch (error) {
      toast.error('Failed to download report')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'audits', label: 'Audits', icon: FileText },
    { id: 'tracking', label: 'Compliance Tracking', icon: Shield },
    { id: 'reports', label: 'Reports', icon: Download }
  ]

  return (
    <div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        width: '100%',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        minHeight: 'calc(100vh - 4rem)'
      }}>
      <div style={{
        width: '100%',
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
            Compliance Center
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Monitor and manage regulatory compliance across all pharmacy operations
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <nav style={{
            display: 'flex',
            gap: '2rem'
          }}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #dc2626' : '2px solid transparent',
                    color: activeTab === tab.id ? '#dc2626' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="compliance-dashboard">
            {/* Inventory Compliance Scan */}
            <div style={{ marginBottom: '2rem' }}>
              <InventoryScanTable />
            </div>

            {/* Recent Activity */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #fecaca'
            }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#dc2626'
              }}>
                Recent Compliance Activity
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                {complianceItems.slice(0, 3).map((item) => {
                  const StatusIcon = getStatusIcon(item.status)
                  return (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <StatusIcon 
                          style={{ 
                            width: '1.25rem', 
                            height: '1.25rem', 
                            color: getStatusColor(item.status) 
                          }} 
                        />
                        <div>
                          <h4 style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#111827'
                          }}>
                            {item.title}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: getStatusColor(item.status),
                        textTransform: 'capitalize'
                      }}>
                        {item.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Audits Tab */}
        {activeTab === 'audits' && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#dc2626'
              }}>
                Audit History
              </h3>
              <Button variant="secondary">
                <Calendar style={{ width: '1rem', height: '1rem' }} />
                Schedule Audit
              </Button>
            </div>

            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Audit Title
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Auditor
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Score
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((audit, index) => {
                    const StatusIcon = getStatusIcon(audit.status)
                    return (
                      <tr key={audit.id} style={{
                        borderBottom: index < recentAudits.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}>
                        <td style={{
                          padding: '1rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#111827'
                        }}>
                          {audit.title}
                        </td>
                        <td style={{
                          padding: '1rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {new Date(audit.date).toLocaleDateString()}
                        </td>
                        <td style={{
                          padding: '1rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {audit.auditor}
                        </td>
                        <td style={{
                          padding: '1rem 0.75rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <StatusIcon 
                              style={{ 
                                width: '1rem', 
                                height: '1rem', 
                                color: getStatusColor(audit.status) 
                              }} 
                            />
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: getStatusColor(audit.status),
                              textTransform: 'capitalize'
                            }}>
                              {audit.status}
                            </span>
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#111827',
                          fontWeight: '600'
                        }}>
                          {audit.score ? `${audit.score}%` : '-'}
                        </td>
                        <td style={{
                          padding: '1rem 0.75rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem'
                          }}>
                            <button style={{
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#6b7280'
                            }}>
                              <Eye style={{ width: '1rem', height: '1rem' }} />
                            </button>
                            <button 
                              onClick={() => handleDownloadReport(audit.id)}
                              disabled={loading}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#6b7280'
                              }}
                            >
                              <Download style={{ width: '1rem', height: '1rem' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compliance Tracking Tab */}
        {activeTab === 'tracking' && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#dc2626'
              }}>
                Compliance Items Tracking
              </h3>
              <Button variant="secondary">
                <Filter style={{ width: '1rem', height: '1rem' }} />
                Filter
              </Button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {complianceItems.map((item) => {
                const StatusIcon = getStatusIcon(item.status)
                return (
                  <div key={item.id} style={{
                    padding: '1.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${getStatusColor(item.status)}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.5rem'
                        }}>
                          <StatusIcon 
                            style={{ 
                              width: '1.25rem', 
                              height: '1.25rem', 
                              color: getStatusColor(item.status) 
                            }} 
                          />
                          <h4 style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>
                            {item.title}
                          </h4>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {item.category}
                          </span>
                        </div>
                        <p style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          lineHeight: 1.5
                        }}>
                          {item.description}
                        </p>
                        <p style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#374151'
                        }}>
                          <strong>Due:</strong> {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: getStatusColor(item.status),
                          textTransform: 'capitalize'
                        }}>
                          {item.status}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Eye style={{ width: '1rem', height: '1rem' }} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#dc2626'
            }}>
              Compliance Reports
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {[
                {
                  title: 'Monthly Compliance Summary',
                  description: 'Comprehensive overview of all compliance activities',
                  type: 'PDF',
                  size: '2.1 MB'
                },
                {
                  title: 'Audit Trail Report',
                  description: 'Detailed audit history and findings',
                  type: 'Excel',
                  size: '1.8 MB'
                },
                {
                  title: 'Regulatory Changes Update',
                  description: 'Latest regulatory changes affecting pharmacy operations',
                  type: 'PDF',
                  size: '3.2 MB'
                }
              ].map((report, index) => (
                <div key={index} style={{
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <FileText style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {report.type}
                    </span>
                  </div>
                  
                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {report.title}
                  </h4>
                  
                  <p style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: 1.5
                  }}>
                    {report.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {report.size}
                    </span>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleDownloadReport(index)}
                      loading={loading}
                    >
                      <Download style={{ width: '1rem', height: '1rem' }} />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export default ComplianceCenter