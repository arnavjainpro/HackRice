import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui'
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  ExternalLink,
  Filter,
  Calendar,
  Users,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'

const ComplianceCenter = () => {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('audits')
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
    { id: 'audits', label: 'Audits', icon: FileText },
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
          .compliance-container {
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
          }
          .compliance-tab-content {
            min-height: 600px;
            display: flex;
            flex-direction: column;
          }
          .compliance-card {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .compliance-card-content {
            flex: 1;
            overflow: hidden;
          }
        `}
      </style>
      <div style={{
        width: '100%',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        minHeight: 'calc(100vh - 4rem)'
      }}>
      <div className="compliance-container">
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
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
          marginBottom: '2rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <nav style={{
            display: 'flex',
            gap: '2rem',
            height: '100%'
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
                    transition: 'all 0.2s ease',
                    height: '100%'
                  }}
                >
                  <IconComponent style={{ width: '1rem', height: '1rem' }} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Audits Tab */}
        {activeTab === 'audits' && (
          <div className="compliance-tab-content">
            <div className="compliance-card" style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              minHeight: '600px'
            }}>
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  textAlign: 'center'
                }}>
                  Sources
                </h3>
              </div>

              <div className="compliance-card-content" style={{
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '500px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '800px'
                }}>
                  <thead style={{ 
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#ffffff',
                    zIndex: 1
                  }}>
                    <tr style={{
                      borderBottom: '1px solid #e5e7eb',
                      height: '48px'
                    }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        width: '40%'
                      }}>
                        Audit Title
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        width: '40%'
                      }}>
                        Auditor
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        width: '20%'
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
                          borderBottom: index < recentAudits.length - 1 ? '1px solid #f3f4f6' : 'none',
                          height: '60px'
                        }}>
                          <td style={{
                            padding: '1rem 0.75rem',
                            fontSize: '0.875rem',
                            color: '#111827',
                            textAlign: 'center'
                          }}>
                            {audit.title}
                          </td>
                          <td style={{
                            padding: '1rem 0.75rem',
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            textAlign: 'center'
                          }}>
                            {audit.auditor}
                          </td>
                          <td style={{
                            padding: '1rem 0.75rem',
                            textAlign: 'center'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}>
                              <button 
                                onClick={() => {
                                  if (audit.title === 'FDA Drug Safety Audit') {
                                    window.open('https://www.accessdata.fda.gov/scripts/drugshortages/default.cfm', '_blank');
                                  } else if (audit.title === 'DEA Controlled Substances') {
                                    window.open('https://www.deadiversion.usdoj.gov/schedules/orangebook/c_cs_alpha.pdf', '_blank');
                                  } else {
                                    // Handle other audit types
                                    console.log('View audit:', audit.title);
                                  }
                                }}
                                style={{
                                  padding: '0.25rem',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#6b7280',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  title: audit.title === 'FDA Drug Safety Audit' ? 'View FDA Drug Shortages Database' : 
                                         audit.title === 'DEA Controlled Substances' ? 'View DEA Controlled Substance List' : 
                                         'View audit details'
                                }}
                              >
                                {(audit.title === 'FDA Drug Safety Audit' || audit.title === 'DEA Controlled Substances') ? (
                                  <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                                ) : (
                                  <Eye style={{ width: '1rem', height: '1rem' }} />
                                )}
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
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="compliance-tab-content">
            <div className="compliance-card" style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              minHeight: '600px'
            }}>
              <h3 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#dc2626',
                height: '32px',
                display: 'flex',
                alignItems: 'center'
              }}>
                Compliance Reports
              </h3>

              <div className="compliance-card-content" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
                maxHeight: '520px',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                {[
                  {
                    title: 'Current Compliance Summary',
                    description: 'Real-time overview of all compliance activities from latest scan',
                    type: 'CSV',
                    size: '1.2 MB'
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
                    borderRadius: '8px',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      height: '40px'
                    }}>
                      <FileText style={{ 
                        width: '1.5rem', 
                        height: '1.5rem', 
                        color: '#dc2626',
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}>
                        {report.type}
                      </span>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#111827',
                        height: '48px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {report.title}
                      </h4>
                      
                      <p style={{
                        margin: '0 0 1rem 0',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        lineHeight: 1.4,
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {report.description}
                      </p>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: '40px',
                      marginTop: 'auto'
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
                        style={{ 
                          height: '32px',
                          minWidth: '100px'
                        }}
                      >
                        <Download style={{ width: '1rem', height: '1rem' }} />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export default ComplianceCenter