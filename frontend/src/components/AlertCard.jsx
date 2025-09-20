import { AlertOctagon, AlertTriangle, RefreshCw } from 'lucide-react';

const AlertCard = ({ alert, onClick }) => {
  // Configure colors and icons based on severity
  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          borderColor: 'border-l-red-500',
          bgColor: 'bg-red-50',
          icon: AlertOctagon,
          iconColor: 'text-red-600'
        };
      case 'AWARENESS':
        return {
          borderColor: 'border-l-yellow-500',
          bgColor: 'bg-yellow-50',
          icon: AlertTriangle,
          iconColor: 'text-yellow-600'
        };
      case 'ROUTINE_REORDER':
        return {
          borderColor: 'border-l-blue-500',
          bgColor: 'bg-blue-50',
          icon: RefreshCw,
          iconColor: 'text-blue-600'
        };
      default:
        return {
          borderColor: 'border-l-slate-500',
          bgColor: 'bg-slate-50',
          icon: AlertTriangle,
          iconColor: 'text-slate-600'
        };
    }
  };

  const config = getSeverityConfig(alert.severity);
  const IconComponent = config.icon;

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${config.bgColor} ${config.borderColor} border-l-4 border border-slate-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-start space-x-3">
        <IconComponent className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {alert.drug_name}
            </h4>
            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
              {formatTimestamp(alert.timestamp)}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {alert.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;