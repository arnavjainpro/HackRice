// Utility to parse CSV data
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(header => header.trim())
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim())
    const row = {}
    
    headers.forEach((header, index) => {
      const value = values[index]
      // Convert numeric values
      if (header === 'Quantity' || header === 'avg_daily_dispensed') {
        row[header] = parseFloat(value) || 0
      } else {
        row[header] = value
      }
    })
    
    data.push(row)
  }
  
  return data
}

// Utility to load CSV data from backend
export const loadPharmacyStock = async () => {
  try {
    // Load the CSV file from the public directory
    const response = await fetch('/pharmacy_stock.csv')
    if (!response.ok) {
      throw new Error('Failed to load pharmacy stock data')
    }
    
    const csvText = await response.text()
    const parsed = parseCSV(csvText)
    
    // Convert to the format expected by the component
    return parsed.map(row => ({
      name: row.Name,
      quantity: row.Quantity,
      avgDailyDispensed: row.avg_daily_dispensed
    }))
  } catch (error) {
    console.error('Error loading pharmacy stock:', error)
    
    // Fallback to mock data if CSV loading fails
    return [
      { name: 'Acyclovir 400mg Tablet', quantity: 680, avgDailyDispensed: 34 },
      { name: 'Rocuronium Bromide Injection', quantity: 150, avgDailyDispensed: 10 },
      { name: 'Cefotaxime Sodium Powder, for Solution', quantity: 90, avgDailyDispensed: 6 },
      { name: 'Ondansetron 4mg Tablet', quantity: 975, avgDailyDispensed: 39 },
      { name: 'Duloxetine DR 60mg Capsule', quantity: 1560, avgDailyDispensed: 52 },
      { name: 'Glipizide XL 5mg Tablet', quantity: 990, avgDailyDispensed: 33 },
      { name: 'Clonazepam Tablet', quantity: 1000, avgDailyDispensed: 10 },
      { name: 'Sildenafil 100mg Tablet', quantity: 700, avgDailyDispensed: 28 },
      { name: 'Paroxetine 20mg Tablet', quantity: 1260, avgDailyDispensed: 42 },
      { name: 'Quetiapine 100mg Tablet', quantity: 1290, avgDailyDispensed: 43 },
      { name: 'Bumetanide Injection', quantity: 126, avgDailyDispensed: 9 },
      { name: 'Meloxicam 15mg Tablet', quantity: 2010, avgDailyDispensed: 67 },
      { name: 'Promethazine Hydrochloride Injection', quantity: 60, avgDailyDispensed: 12 },
      { name: 'Fluconazole 150mg Tablet', quantity: 420, avgDailyDispensed: 21 },
      { name: 'Methylphenidate Film, Extended Release', quantity: 25, avgDailyDispensed: 5 },
      { name: 'Clopidogrel 75mg Tablet', quantity: 2490, avgDailyDispensed: 83 },
      { name: 'Azithromycin 250mg Tablet', quantity: 66, avgDailyDispensed: 11 },
      { name: 'Epinephrine Bitartrate, Lidocaine Hydrochloride Injection', quantity: 72, avgDailyDispensed: 8 },
      { name: 'Trazodone 100mg Tablet', quantity: 1950, avgDailyDispensed: 65 },
      { name: 'Alprazolam 0.5mg Tablet', quantity: 1050, avgDailyDispensed: 35 }
    ]
  }
}