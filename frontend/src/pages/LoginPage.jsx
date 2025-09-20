import { Pill } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const handleLogin = () => {
    // Placeholder for Supabase login redirect
    console.log('Login button clicked - Supabase integration would go here');
    onLogin(); // For demo purposes, immediately authenticate
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center items-center mb-4">
            <Pill className="w-12 h-12 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-slate-900">RxBridge</h1>
          </div>
          
          {/* Tagline */}
          <p className="text-slate-600 text-lg mb-8">
            The AI Pharmacy Supply Chain Assistant
          </p>
          
          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;