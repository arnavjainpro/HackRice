import { useState } from 'react';
import { Activity } from 'lucide-react';

const SimulationPanel = ({ inventoryList, onTriggerShortage, isLoading }) => {
  const [selectedDrug, setSelectedDrug] = useState('');

  const handleTriggerShortage = () => {
    if (selectedDrug && !isLoading) {
      onTriggerShortage(selectedDrug);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-dashed border-slate-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Simulation Panel
        </h3>
        <p className="text-sm text-slate-600">
          <span className="font-medium">For Demo Purposes</span>
        </p>
      </div>

      <div className="space-y-4">
        {/* Dropdown */}
        <div>
          <label htmlFor="drug-select" className="block text-sm font-medium text-slate-700 mb-2">
            Select Drug to Simulate Shortage
          </label>
          <select
            id="drug-select"
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">Choose a drug...</option>
            {inventoryList.map((item) => (
              <option key={item.id} value={item.drug_name}>
                {item.drug_name}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Button */}
        <button
          onClick={handleTriggerShortage}
          disabled={!selectedDrug || isLoading}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            !selectedDrug || isLoading
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>Trigger Shortage Event</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SimulationPanel;