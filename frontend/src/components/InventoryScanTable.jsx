import React, { useState, useEffect } from 'react'
import { Search, Filter, Package, TrendingDown, AlertTriangle, ChevronUp, ChevronDown, Info, X, RefreshCw, ShieldAlert, Scan, Clock, Brain, Lightbulb, Zap, Mail, Send, User, Phone, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

const InventoryScanTable = () => {
  // Load initial scan data from localStorage
  const [scanData, setScanData] = useState(() => {
    try {
      const saved = localStorage.getItem('rxbridge_scan_data')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error loading scan data from localStorage:', error)
      return null
    }
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterConfig, setFilterConfig] = useState('all') // all, red, purple, yellow, blue
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showLegend, setShowLegend] = useState(false)
  
  // Load last scan time from localStorage
  const [lastScanTime, setLastScanTime] = useState(() => {
    try {
      const saved = localStorage.getItem('rxbridge_last_scan_time')
      return saved ? new Date(saved) : null
    } catch (error) {
      console.error('Error loading last scan time from localStorage:', error)
      return null
    }
  })
  
  // AI Recommendations Modal
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  
  // Track if current data is from cache vs fresh scan
  const [isDataFromCache, setIsDataFromCache] = useState(false)

  // Persist scan data to localStorage whenever it changes
  useEffect(() => {
    if (scanData) {
      try {
        localStorage.setItem('rxbridge_scan_data', JSON.stringify(scanData))
      } catch (error) {
        console.error('Error saving scan data to localStorage:', error)
      }
    }
  }, [scanData])

  // Persist last scan time to localStorage whenever it changes  
  useEffect(() => {
    if (lastScanTime) {
      try {
        localStorage.setItem('rxbridge_last_scan_time', lastScanTime.toISOString())
      } catch (error) {
        console.error('Error saving last scan time to localStorage:', error)
      }
    }
  }, [lastScanTime])

  // Set cache flag on component mount if data exists
  useEffect(() => {
    if (scanData && lastScanTime) {
      setIsDataFromCache(true)
    }
  }, [])

  // Call the backend POST endpoint
  const performInventoryScan = async () => {
    if (loading) {
      toast.error('Scan already in progress. Please wait...')
      return
    }

    setLoading(true)
    setLoadingMessage('Initializing compliance scan...')
    
    try {
      // Simulate progress updates for better UX
      const progressMessages = [
        'Fetching inventory data...',
        'Retrieving FDA shortage information...',
        'Checking recent drug recalls...',
        'Analyzing critical alerts...',
        'Processing compliance data...',
        'Finalizing results...'
      ]

      let messageIndex = 0
      const progressInterval = setInterval(() => {
        if (messageIndex < progressMessages.length) {
          setLoadingMessage(progressMessages[messageIndex])
          messageIndex++
        }
      }, 1500) // Update message every 1.5 seconds

      // Use the proxied path which will be forwarded to the backend
      const response = await fetch('/inventory/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status === 'success') {
        setScanData(data)
        setLastScanTime(new Date())
        setIsDataFromCache(false) // Mark as fresh data
        setLoadingMessage('Scan completed successfully!')
        toast.success(`✅ Scan completed! Found ${data.summary.items_requiring_attention} items needing attention`)
      } else {
        toast.error('❌ Scan failed: ' + (data.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('❌ Failed to perform inventory scan: ' + error.message)
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  // Clear cached scan data
  const clearScanData = () => {
    try {
      localStorage.removeItem('rxbridge_scan_data')
      localStorage.removeItem('rxbridge_last_scan_time')
      setScanData(null)
      setLastScanTime(null)
      setIsDataFromCache(false)
      toast.success('🗑️ Scan data cleared successfully')
    } catch (error) {
      console.error('Error clearing scan data:', error)
      toast.error('Failed to clear scan data')
    }
  }

  // Fetch AI recommendations for a specific drug
  const fetchAIRecommendations = async (drugItem) => {
    setLoadingAI(true)
    setSelectedDrug(drugItem)
    setShowAIModal(true)
    
    try {
      const response = await fetch('/ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drug_name: drugItem.drug_name,
          flag: drugItem.flag
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAiRecommendations(data)
      
    } catch (error) {
      console.error('AI recommendations error:', error)
      toast.error('Failed to get AI recommendations: ' + error.message)
      setAiRecommendations({
        alt1: null,
        d1: 'Unable to load AI recommendations. Please try again.',
        alt2: null,
        d2: null,
        alt3: null,
        d3: null,
        email: 'Please contact support for assistance.'
      })
    } finally {
      setLoadingAI(false)
    }
  }

  // Handle escape key to close modals
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowLegend(false)
        setShowAIModal(false)
      }
    }

    if (showLegend) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showLegend])

  // Get status color based on alert level
  const getStatusColor = (alertLevel) => {
    switch (alertLevel) {
      case 'RED': return '#dc2626'        // Critical - immediate action
      case 'PURPLE': return '#7c3aed'     // Recall items
      case 'YELLOW': return '#eab308'     // Discontinuation
      case 'BLUE': return '#2563eb'       // Low stock
      default: return '#059669'           // Good
    }
  }

  // Get status icon based on alert level
  const getStatusIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'RED': return AlertTriangle
      case 'PURPLE': return ShieldAlert
      case 'YELLOW': return TrendingDown
      case 'BLUE': return Package
      default: return Package
    }
  }

  // Get status label
  const getStatusLabel = (alertLevel) => {
    switch (alertLevel) {
      case 'RED': return 'Critical'
      case 'PURPLE': return 'Recalled'
      case 'YELLOW': return 'Discontinued'
      case 'BLUE': return 'Low Stock'
      default: return 'Normal'
    }
  }

  // Filter and search data
  const filteredData = React.useMemo(() => {
    if (!scanData) return []
    
    // Combine recalls and other_alerts into one array
    const allItems = [
      ...(scanData.recalls || []),
      ...(scanData.other_alerts || [])
    ]
    
    let filtered = allItems.filter(item => {
      const matchesSearch = item.drug_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesFilter = true
      if (filterConfig !== 'all') {
        matchesFilter = item.alert_level === filterConfig.toUpperCase()
      }
      
      return matchesSearch && matchesFilter
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        
        // Special handling for numeric fields
        if (sortConfig.key === 'current_stock' || sortConfig.key === 'average_daily_dispense' || sortConfig.key === 'days_of_supply') {
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [scanData, searchTerm, filterConfig, sortConfig])

  // Pagination logic
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterConfig])

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? ChevronUp : ChevronDown
  }

  return (
    <div 
      className="inventory-scan-table"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #fecaca',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #fecaca'
      }}>
        <div 
          className="inventory-scan-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Scan style={{ width: '1.25rem', height: '1.25rem' }} />
              Inventory Compliance Scan
              <button
                onClick={() => setShowLegend(true)}
                style={{
                  padding: '0.25rem',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  marginLeft: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6'
                  e.target.style.borderColor = '#9ca3af'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.borderColor = '#d1d5db'
                }}
              >
                <Info style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
              </button>
            </h3>
            
            {lastScanTime && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                Last scan: {lastScanTime.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {scanData && (
              <button
                onClick={clearScanData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <X style={{ width: '0.875rem', height: '0.875rem' }} />
                Clear Data
              </button>
            )}
            
            <button
              onClick={performInventoryScan}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#9ca3af' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#b91c1c'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#dc2626'
              }
            }}
          >
            {loading ? (
              <>
                <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                Scanning...
              </>
            ) : (
              <>
                <Scan style={{ width: '1rem', height: '1rem' }} />
                Run Compliance Scan
              </>
            )}
          </button>
          </div>

          {/* Loading message */}
          {loading && loadingMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#1d4ed8'
            }}>
              <RefreshCw style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
              {loadingMessage}
            </div>
          )}
        </div>

        {/* Filters */}
        {scanData && (
          <>
            <div 
              className="inventory-scan-filters"
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}
            >
              {/* Filter buttons */}
              <div style={{
                display: 'flex',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '0.25rem'
              }}>
                {[
                  { key: 'all', label: 'All Items' },
                  { key: 'red', label: 'Critical' },
                  { key: 'purple', label: 'Recalled' },
                  { key: 'yellow', label: 'Discontinued' },
                  { key: 'blue', label: 'Low Stock' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterConfig(filter.key)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: filterConfig === filter.key ? '#dc2626' : 'transparent',
                      color: filterConfig === filter.key ? '#ffffff' : '#6b7280',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div 
              className="inventory-scan-search"
              style={{
                position: 'relative',
                maxWidth: '400px'
              }}
            >
              <Search style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Summary stats */}
      {scanData && scanData.summary && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div 
            className="inventory-scan-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827'
              }}>
                {scanData.summary.total_items_checked}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Items Checked
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#dc2626'
              }}>
                {scanData.summary.alert_breakdown?.RED || 0}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Critical
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#7c3aed'
              }}>
                {scanData.summary.alert_breakdown?.PURPLE || 0}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Recalled
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#eab308'
              }}>
                {scanData.summary.alert_breakdown?.YELLOW || 0}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Discontinued
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#2563eb'
              }}>
                {scanData.summary.alert_breakdown?.BLUE || 0}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Low Stock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {scanData && paginatedData.length > 0 ? (
          <>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
            <thead>
              <tr style={{
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Status
                </th>
                <th 
                  onClick={() => handleSort('drug_name')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    Drug Name
                    {getSortIcon('drug_name') && React.createElement(getSortIcon('drug_name'), { 
                      style: { width: '0.75rem', height: '0.75rem' } 
                    })}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('current_stock')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    Current Stock
                    {getSortIcon('current_stock') && React.createElement(getSortIcon('current_stock'), { 
                      style: { width: '0.75rem', height: '0.75rem' } 
                    })}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('average_daily_dispense')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    Daily Usage
                    {getSortIcon('average_daily_dispense') && React.createElement(getSortIcon('average_daily_dispense'), { 
                      style: { width: '0.75rem', height: '0.75rem' } 
                    })}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('days_of_supply')}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    Days Supply
                    {getSortIcon('days_of_supply') && React.createElement(getSortIcon('days_of_supply'), { 
                      style: { width: '0.75rem', height: '0.75rem' } 
                    })}
                  </div>
                </th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  FDA Status
                </th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  AI Recommendations
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const StatusIcon = getStatusIcon(item.alert_level)
                
                return (
                  <tr key={item.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'center'
                      }}>
                        <StatusIcon 
                          style={{ 
                            width: '1rem', 
                            height: '1rem', 
                            color: getStatusColor(item.alert_level) 
                          }} 
                        />
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: getStatusColor(item.alert_level)
                        }}>
                          {getStatusLabel(item.alert_level)}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      maxWidth: '300px',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#111827',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}>
                        {item.drug_name}
                      </p>
                      {item.requires_immediate_action && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '0.25rem',
                          padding: '0.125rem 0.375rem',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Immediate Action Required
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {item.current_stock?.toLocaleString()}
                      </span>
                    </td>
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {item.average_daily_dispense}/day
                      </span>
                    </td>
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: getStatusColor(item.alert_level)
                      }}>
                        {item.days_of_supply} days
                      </span>
                    </td>
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: item.fda_status === 'Recalled' ? '#dc2626' : '#6b7280',
                        backgroundColor: item.fda_status === 'Recalled' ? '#fee2e2' : '#f3f4f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {item.fda_status}
                      </span>
                    </td>
                    <td style={{
                      padding: '1rem',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      {item.alert_level !== 'BLUE' && (
                        <button
                          onClick={() => fetchAIRecommendations(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2563eb'
                            e.target.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#3b82f6'
                            e.target.style.transform = 'translateY(0)'
                          }}
                        >
                          <Brain style={{ width: '0.875rem', height: '0.875rem' }} />
                          Get AI Help
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredData.length > itemsPerPage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              {/* Results Info */}
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
              </div>

              {/* Pagination Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.target.style.backgroundColor = '#f3f4f6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                      e.target.style.backgroundColor = '#ffffff'
                    }
                  }}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1
                    const isCurrentPage = pageNumber === currentPage
                    
                    // Show first page, last page, current page, and pages around current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: isCurrentPage ? '#3b82f6' : '#ffffff',
                            color: isCurrentPage ? '#ffffff' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: isCurrentPage ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: '2.5rem'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentPage) {
                              e.target.style.backgroundColor = '#f3f4f6'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentPage) {
                              e.target.style.backgroundColor = '#ffffff'
                            }
                          }}
                        >
                          {pageNumber}
                        </button>
                      )
                    } else if (
                      (pageNumber === currentPage - 2 && currentPage > 3) ||
                      (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={pageNumber} style={{
                          padding: '0.5rem 0.25rem',
                          color: '#9ca3af',
                          fontSize: '0.875rem'
                        }}>
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                      e.target.style.backgroundColor = '#f3f4f6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                      e.target.style.backgroundColor = '#ffffff'
                    }
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        ) : scanData ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Package style={{
              width: '3rem',
              height: '3rem',
              color: '#d1d5db',
              margin: '0 auto 1rem'
            }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {searchTerm || filterConfig !== 'all' 
                ? 'No items found matching your search criteria'
                : 'No compliance issues found. All inventory is within acceptable parameters.'
              }
            </p>
          </div>
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Scan style={{
              width: '4rem',
              height: '4rem',
              color: '#d1d5db',
              margin: '0 auto 1rem'
            }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Ready to Scan</h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>
              Click "Run Compliance Scan" to check your inventory for recalls, shortages, and other compliance issues.
            </p>
          </div>
        )}
      </div>

      {/* Status Legend Modal */}
      {showLegend && (
        <div 
          className="inventory-scan-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLegend(false)
            }
          }}
        >
          <div 
            className="inventory-scan-modal-content"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div 
              className="inventory-scan-modal-header"
              style={{
                padding: '1.5rem 1.5rem 1rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                Compliance Alert Status Guide
              </h3>
              <button
                onClick={() => setShowLegend(false)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="inventory-scan-modal-body" style={{ padding: '1.5rem' }}>
              <p style={{
                margin: '0 0 1.5rem 0',
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.5
              }}>
                The compliance scan checks your inventory against FDA databases for recalls, shortages, and other regulatory issues.
              </p>

              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {[
                  { 
                    status: 'RED', 
                    label: 'Critical', 
                    description: 'Immediate action required - patient safety risk or critical shortage',
                    icon: AlertTriangle
                  },
                  { 
                    status: 'PURPLE', 
                    label: 'Recalled', 
                    description: 'FDA recall issued - review recall classification and take appropriate action',
                    icon: ShieldAlert
                  },
                  { 
                    status: 'YELLOW', 
                    label: 'Discontinued', 
                    description: 'Manufacturer discontinued - plan for alternative sourcing',
                    icon: TrendingDown
                  },
                  { 
                    status: 'BLUE', 
                    label: 'Low Stock', 
                    description: 'Inventory level below recommended threshold - reorder soon',
                    icon: Package
                  }
                ].map(item => {
                  const StatusIcon = item.icon
                  return (
                    <div 
                      key={item.status}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexShrink: 0
                        }}>
                          <StatusIcon 
                            style={{ 
                              width: '1.125rem', 
                              height: '1.125rem', 
                              color: getStatusColor(item.status)
                            }} 
                          />
                          <div style={{
                            width: '0.875rem',
                            height: '0.875rem',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(item.status)
                          }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: getStatusColor(item.status)
                          }}>
                            {item.label}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '0.8125rem',
                            color: '#374151',
                            lineHeight: 1.4
                          }}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef7f7',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  color: '#991b1b',
                  lineHeight: 1.4
                }}>
                  <strong>Note:</strong> This scan cross-references your inventory with FDA databases in real-time. 
                  Items requiring immediate action will be flagged for priority review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showAIModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '2rem 2rem 1rem 2rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1 }}>
                <h1 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  letterSpacing: '-0.025em'
                }}>
                  AI Recommendation for {selectedDrug?.drug_name}
                </h1>
                <button
                  onClick={() => setShowAIModal(false)}
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#64748b',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9'
                    e.target.style.color = '#334155'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.color = '#64748b'
                  }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '1.5rem 2rem 2rem 2rem'
            }}>
              {loadingAI ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 1rem',
                  textAlign: 'center'
                }}>
                  <RefreshCw style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    color: '#3b82f6',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                  }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontWeight: '600' }}>
                    Generating AI Recommendations
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                    Analyzing drug data and compliance requirements...
                  </p>
                </div>
              ) : aiRecommendations ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Current Alert Section */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    <h3 style={{
                      margin: '0 0 1rem 0',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#334155'
                    }}>
                      Current Alert
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#64748b'
                      }}>
                        Severity:
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: selectedDrug?.alert_level === 'RED' ? '#dc2626' : 
                               selectedDrug?.alert_level === 'PURPLE' ? '#7c3aed' :
                               selectedDrug?.alert_level === 'YELLOW' ? '#d97706' : '#0891b2',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedDrug?.alert_level === 'RED' ? 'CRITICAL' : 
                         selectedDrug?.alert_level === 'PURPLE' ? 'RECALLED' :
                         selectedDrug?.alert_level === 'YELLOW' ? 'SHORTAGE' : 'AWARENESS'}
                      </span>
                    </div>
                    
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#475569',
                      lineHeight: 1.5
                    }}>
                      {selectedDrug?.alert_level === 'RED' ? 'Critical shortage - Immediate action required' :
                       selectedDrug?.alert_level === 'PURPLE' ? 'Product recalled - Stop dispensing immediately' :
                       selectedDrug?.alert_level === 'YELLOW' ? 'Supply shortage detected - Monitor closely' :
                       `Low stock warning - ${selectedDrug?.days_of_supply || 0} days of supply remaining`}
                    </p>
                  </div>

                  {/* AI Recommendation Section */}
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1.5rem'
                    }}>
                      <Lightbulb style={{ width: '1.125rem', height: '1.125rem', color: '#0369a1' }} />
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#0369a1'
                      }}>
                        AI Recommendations
                      </h3>
                    </div>

                    {/* Alternative Medications */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {aiRecommendations.alt1 && (
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0f2fe',
                          borderRadius: '8px',
                          padding: '1rem'
                        }}>
                          <h4 style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            Alternative 1: {aiRecommendations.alt1}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#475569',
                            lineHeight: 1.5
                          }}>
                            {aiRecommendations.d1}
                          </p>
                        </div>
                      )}

                      {aiRecommendations.alt2 && (
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0f2fe',
                          borderRadius: '8px',
                          padding: '1rem'
                        }}>
                          <h4 style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            Alternative 2: {aiRecommendations.alt2}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#475569',
                            lineHeight: 1.5
                          }}>
                            {aiRecommendations.d2}
                          </p>
                        </div>
                      )}

                      {aiRecommendations.alt3 && (
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0f2fe',
                          borderRadius: '8px',
                          padding: '1rem'
                        }}>
                          <h4 style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            Alternative 3: {aiRecommendations.alt3}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#475569',
                            lineHeight: 1.5
                          }}>
                            {aiRecommendations.d3}
                          </p>
                        </div>
                      )}

                      {!aiRecommendations.alt1 && !aiRecommendations.alt2 && !aiRecommendations.alt3 && (
                        <div style={{
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fbbf24',
                          borderRadius: '8px',
                          padding: '1rem',
                          textAlign: 'center'
                        }}>
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#92400e',
                            fontWeight: '500'
                          }}>
                            No alternative medications currently available.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    {aiRecommendations.email && (
                      <div style={{
                        marginTop: '1.5rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <h4 style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#334155'
                        }}>
                          Contact Information:
                        </h4>
                        <p style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          color: '#475569',
                          lineHeight: 1.5
                        }}>
                          {aiRecommendations.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <AlertTriangle style={{ width: '2rem', height: '2rem', marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    Failed to load AI recommendations. Please try again.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer with Action Buttons */}
            {!loadingAI && aiRecommendations && (
              <div style={{
                padding: '1.5rem 2rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setShowAIModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9'
                    e.target.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8fafc'
                    e.target.style.borderColor = '#e2e8f0'
                  }}
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    toast.success('Email communication feature coming soon!')
                    // TODO: Implement email functionality
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                >
                  <Send style={{ width: '1rem', height: '1rem' }} />
                  Generate Communication
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryScanTable