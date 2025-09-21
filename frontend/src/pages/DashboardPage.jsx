import { useState } from 'react';
import Header from '../components/Header';
import InventoryScanTable from '../components/InventoryScanTable';

const DashboardPage = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header user={user} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Inventory Compliance Scan - Full Dashboard */}
          <InventoryScanTable />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;