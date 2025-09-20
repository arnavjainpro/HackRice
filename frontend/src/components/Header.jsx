import { Pill, LogOut } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const handleLogout = () => {
    // Placeholder for Supabase logout
    console.log('Logout button clicked - Supabase integration would go here');
    onLogout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Pill className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-slate-900">RxBridge</h1>
          </div>
          
          {/* Right: User info and logout */}
          <div className="flex items-center space-x-4">
            <span className="text-slate-700 font-medium">
              Welcome, {user?.name || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;