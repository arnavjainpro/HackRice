import AlertCard from './AlertCard';

const AlertFeed = ({ alerts, onAlertClick }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Alert Feed</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-slate-600">No new alerts. All systems normal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Alert Feed ({alerts.length})
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onClick={() => onAlertClick(alert)}
          />
        ))}
      </div>
    </div>
  );
};

export default AlertFeed;