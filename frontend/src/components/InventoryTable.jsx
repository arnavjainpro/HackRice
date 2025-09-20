const InventoryTable = ({ inventoryList }) => {
  // Determine row background color based on alert status
  const getRowClassName = (item) => {
    if (!item.hasAlert) return 'bg-white hover:bg-slate-50';
    
    switch (item.alertSeverity) {
      case 'CRITICAL':
        return 'bg-red-100 hover:bg-red-150';
      case 'AWARENESS':
        return 'bg-yellow-100 hover:bg-yellow-150';
      case 'ROUTINE_REORDER':
        return 'bg-blue-100 hover:bg-blue-150';
      default:
        return 'bg-white hover:bg-slate-50';
    }
  };

  // Determine stock level color
  const getStockLevelColor = (daysOfSupply) => {
    if (daysOfSupply <= 5) return 'text-red-600 font-semibold';
    if (daysOfSupply <= 10) return 'text-yellow-600 font-semibold';
    return 'text-slate-900';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Inventory Overview</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Drug Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Avg Daily Use
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Days of Supply
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {inventoryList.map((item, index) => (
              <tr
                key={item.id}
                className={`${getRowClassName(item)} transition-colors duration-150`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {item.drug_name}
                      </div>
                      {item.hasAlert && (
                        <div className="text-xs text-slate-500">
                          Alert: {item.alertSeverity.replace('_', ' ').toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${getStockLevelColor(item.days_of_supply)}`}>
                    {item.stock_level} units
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">
                    {item.avg_daily_use} units/day
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${getStockLevelColor(item.days_of_supply)}`}>
                    {item.days_of_supply} days
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;