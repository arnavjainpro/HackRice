import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Package, TrendingDown, AlertTriangle, ChevronUp, ChevronDown, Info, X } from 'lucide-react'
import { loadPharmacyStock } from '../utils/csvLoader'

const PharmacyStockTable = () => {
  const [stockData, setStockData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterConfig, setFilterConfig] = useState('all') // all, low-stock, critical
  const [loading, setLoading] = useState(true)
  const [showLegend, setShowLegend] = useState(false)

  // Load stock data from CSV file
  useEffect(() => {
    const loadStockData = async () => {
      setLoading(true)
      try {
        const data = await loadPharmacyStock()
        setStockData(data)
      } catch (error) {
        console.error('Error loading stock data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStockData()
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowLegend(false)
      }
    }

    if (showLegend) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showLegend])

  // Calculate days remaining based on current stock and average daily dispensed
  const getDaysRemaining = (quantity, avgDaily) => {
    if (avgDaily === 0) return Infinity
    return Math.floor(quantity / avgDaily)
  }

  // Determine stock status based on days remaining
  const getStockStatus = (quantity, avgDaily) => {
    const daysRemaining = getDaysRemaining(quantity, avgDaily)
    
    // Check for inventory shortage (very low quantity regardless of usage)
    if (quantity <= 50) return 'shortage'
    
    // Days remaining categories
    if (daysRemaining <= 14) return 'high'      // 2 weeks and under - Red
    if (daysRemaining <= 56) return 'medium'    // 2-8 weeks - Purple  
    if (daysRemaining >= 57) return 'low'       // 8+ weeks - Yellow
    
    return 'good'
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'high': return '#dc2626'        // Red - 2 weeks and under (was critical)
      case 'medium': return '#7c3aed'      // Purple - 2-8 weeks (was low/orange)
      case 'low': return '#eab308'         // Yellow - 8+ weeks (was adequate)
      case 'shortage': return '#2563eb'    // Blue - Inventory shortage
      case 'good': return '#059669'        // Green - Everything good
      default: return '#6b7280'
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'high': return AlertTriangle      // was critical
      case 'medium': return TrendingDown     // was low
      case 'low': return Package             // was adequate
      case 'shortage': return AlertTriangle
      case 'good': return Package
      default: return Package
    }
  }

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = stockData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const status = getStockStatus(item.quantity, item.avgDailyDispensed)
      
      let matchesFilter = true
      if (filterConfig === 'low-stock') {
        matchesFilter = status === 'medium' || status === 'high' || status === 'shortage'
      } else if (filterConfig === 'critical') {
        matchesFilter = status === 'high' || status === 'shortage'
      }
      
      return matchesSearch && matchesFilter
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        
        // Special handling for days remaining
        if (sortConfig.key === 'daysRemaining') {
          aValue = getDaysRemaining(a.quantity, a.avgDailyDispensed)
          bValue = getDaysRemaining(b.quantity, b.avgDailyDispensed)
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [stockData, searchTerm, filterConfig, sortConfig])

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

  if (loading) {
    return (
      <div 
        className="pharmacy-stock-loading"
        style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          textAlign: 'center'
        }}
      >
        <div 
          className="pharmacy-stock-loading-spinner"
          style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid #fecaca',
            borderTop: '2px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}
        />
        <p style={{ margin: 0, color: '#6b7280' }}>Loading pharmacy stock data...</p>
      </div>
    )
  }

  return (
    <div 
      className="pharmacy-stock-table"
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
          className="pharmacy-stock-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Package style={{ width: '1.25rem', height: '1.25rem' }} />
            Pharmacy Stock Inventory
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
          
          <div 
            className="pharmacy-stock-filters"
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap'
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
                { key: 'all', label: 'All Stock' },
                { key: 'low-stock', label: 'Needs Attention' },
                { key: 'critical', label: 'Urgent' }
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
        </div>

        {/* Search bar */}
        <div 
          className="pharmacy-stock-search"
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
              transition: 'border-color 0.2s ease',
              ':focus': {
                borderColor: '#dc2626'
              }
            }}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        padding: '1rem 1.5rem',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div 
          className="pharmacy-stock-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
              {filteredData.length}
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Total Items
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: '0 0 0.25rem 0',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#dc2626'
            }}>
              {stockData.filter(item => getStockStatus(item.quantity, item.avgDailyDispensed) === 'high').length}
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              High (≤2 weeks)
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: '0 0 0.25rem 0',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#2563eb'
            }}>
              {stockData.filter(item => getStockStatus(item.quantity, item.avgDailyDispensed) === 'shortage').length}
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Shortages
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: '0 0 0.25rem 0',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#7c3aed'
            }}>
              {stockData.filter(item => getStockStatus(item.quantity, item.avgDailyDispensed) === 'medium').length}
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Medium (2-8 weeks)
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: '0 0 0.25rem 0',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#eab308'
            }}>
              {stockData.filter(item => getStockStatus(item.quantity, item.avgDailyDispensed) === 'low').length}
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Low (8+ weeks)
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
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
                onClick={() => handleSort('name')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Medication Name
                  {getSortIcon('name') && React.createElement(getSortIcon('name'), { 
                    style: { width: '0.75rem', height: '0.75rem' } 
                  })}
                </div>
              </th>
              <th 
                onClick={() => handleSort('quantity')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Current Stock
                  {getSortIcon('quantity') && React.createElement(getSortIcon('quantity'), { 
                    style: { width: '0.75rem', height: '0.75rem' } 
                  })}
                </div>
              </th>
              <th 
                onClick={() => handleSort('avgDailyDispensed')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Daily Usage
                  {getSortIcon('avgDailyDispensed') && React.createElement(getSortIcon('avgDailyDispensed'), { 
                    style: { width: '0.75rem', height: '0.75rem' } 
                  })}
                </div>
              </th>
              <th 
                onClick={() => handleSort('daysRemaining')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Days Remaining
                  {getSortIcon('daysRemaining') && React.createElement(getSortIcon('daysRemaining'), { 
                    style: { width: '0.75rem', height: '0.75rem' } 
                  })}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => {
              const status = getStockStatus(item.quantity, item.avgDailyDispensed)
              const StatusIcon = getStatusIcon(status)
              const daysRemaining = getDaysRemaining(item.quantity, item.avgDailyDispensed)
              
              return (
                <tr key={index} style={{
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.2s ease',
                  ':hover': {
                    backgroundColor: '#f9fafb'
                  }
                }}>
                  <td style={{
                    padding: '1rem',
                    verticalAlign: 'middle'
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
                          color: getStatusColor(status) 
                        }} 
                      />
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: getStatusColor(status),
                        textTransform: 'capitalize'
                      }}>
                        {status === 'low' ? 'Low' : 
                         status === 'medium' ? 'Medium' :
                         status === 'high' ? 'High' :
                         status === 'shortage' ? 'Shortage' : 
                         status}
                      </span>
                    </div>
                  </td>
                  <td style={{
                    padding: '1rem',
                    verticalAlign: 'middle',
                    maxWidth: '300px'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#111827',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      {item.name}
                    </p>
                  </td>
                  <td style={{
                    padding: '1rem',
                    verticalAlign: 'middle'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td style={{
                    padding: '1rem',
                    verticalAlign: 'middle'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {item.avgDailyDispensed}/day
                    </span>
                  </td>
                  <td style={{
                    padding: '1rem',
                    verticalAlign: 'middle'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: getStatusColor(status)
                    }}>
                      {daysRemaining === Infinity ? '∞' : `${daysRemaining} days`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
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
            No medications found matching your search criteria
          </p>
        </div>
      )}

      {/* Color Legend Modal */}
      {showLegend && (
        <div 
          className="pharmacy-stock-modal"
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
            className="pharmacy-stock-modal-content"
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
              className="pharmacy-stock-modal-header"
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
                Stock Status Color Guide
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
            <div className="pharmacy-stock-modal-body" style={{ padding: '1.5rem' }}>
              <p style={{
                margin: '0 0 1.5rem 0',
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.5
              }}>
                Stock status is determined by calculating days remaining based on current inventory and average daily usage.
              </p>

              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {[
                  { 
                    status: 'high', 
                    label: 'High (≤2 weeks)', 
                    description: 'Immediate reorder needed - stock will run out in 14 days or less',
                    timeframe: '0-14 days remaining'
                  },
                  { 
                    status: 'medium', 
                    label: 'Medium (2-8 weeks)', 
                    description: 'Plan reorder soon - stock adequate for 2-8 weeks',
                    timeframe: '15-56 days remaining'
                  },
                  { 
                    status: 'low', 
                    label: 'Low (8+ weeks)', 
                    description: 'Well stocked - supply will last 8 weeks or more',
                    timeframe: '57+ days remaining'
                  },
                  { 
                    status: 'shortage', 
                    label: 'Inventory Shortage', 
                    description: 'Very low inventory (≤50 units) regardless of usage rate',
                    timeframe: 'Quantity threshold alert'
                  },
                  { 
                    status: 'good', 
                    label: 'Optimal', 
                    description: 'Everything is in good condition with no immediate concerns',
                    timeframe: 'No action needed'
                  }
                ].map(item => {
                  const StatusIcon = getStatusIcon(item.status)
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
                            margin: '0 0 0.25rem 0',
                            fontSize: '0.8125rem',
                            color: '#374151',
                            lineHeight: 1.4
                          }}>
                            {item.description}
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            {item.timeframe}
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
                  <strong>Note:</strong> Days remaining is calculated as: Current Stock ÷ Average Daily Usage. 
                  Shortage status takes priority when inventory falls below 50 units.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PharmacyStockTable