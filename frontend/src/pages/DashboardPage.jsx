import { useState } from 'react';
import Header from '../components/Header';
import InventoryTable from '../components/InventoryTable';
import SimulationPanel from '../components/SimulationPanel';
import AlertFeed from '../components/AlertFeed';
import AlertDetailModal from '../components/AlertDetailModal';
import CommunicationModal from '../components/CommunicationModal';

const DashboardPage = ({ user, onLogout }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const [inventoryList] = useState([
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
  ]);

  const [alerts] = useState([
    {
      id: 1,
      drug_name: 'Lisinopril 10mg',
      severity: 'CRITICAL',
      description: 'Critical shortage detected - only 8 days remaining',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 2,
      drug_name: 'Atorvastatin 20mg',
      severity: 'AWARENESS',
      description: 'Low stock warning - 4 days of supply remaining',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      id: 3,
      drug_name: 'Levothyroxine 50mcg',
      severity: 'ROUTINE_REORDER',
      description: 'Routine reorder suggested based on usage patterns',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    }
  ]);

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
  };

  const handleGenerateCommunication = (drug) => {
    setSelectedDrug(drug);
    setSelectedAlert(null);
    setCommunicationModalOpen(true);
  };

  const handleTriggerShortage = (selectedDrugName) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log(`Triggered shortage event for ${selectedDrugName}`);
      // In a real app, this would create new alerts and update inventory
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header user={user} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column - Inventory Table (70% on desktop) */}
          <div className="lg:col-span-7">
            <InventoryTable inventoryList={inventoryList} />
          </div>
          
          {/* Right Column - Simulation Panel + Alert Feed (30% on desktop) */}
          <div className="lg:col-span-3 space-y-6">
            <SimulationPanel
              inventoryList={inventoryList}
              onTriggerShortage={handleTriggerShortage}
              isLoading={isLoading}
            />
            <AlertFeed alerts={alerts} onAlertClick={handleAlertClick} />
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onGenerateCommunication={handleGenerateCommunication}
        />
      )}

      {communicationModalOpen && (
        <CommunicationModal
          drug={selectedDrug}
          onClose={() => {
            setCommunicationModalOpen(false);
            setSelectedDrug(null);
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;