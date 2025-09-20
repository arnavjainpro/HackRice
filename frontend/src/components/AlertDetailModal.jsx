import { useState, useEffect } from 'react';
import { X, Send, Lightbulb } from 'lucide-react';

const AlertDetailModal = ({ alert, onClose, onGenerateCommunication }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    // Simulate AI recommendation generation
    const timer = setTimeout(() => {
      setRecommendation({
        alternative_drug: getAlternativeDrug(alert.drug_name),
        justification: getJustification(alert.drug_name, alert.severity)
      });
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [alert]);

  // Mock AI recommendations
  const getAlternativeDrug = (drugName) => {
    const alternatives = {
      'Lisinopril 10mg': 'Enalapril 10mg',
      'Atorvastatin 20mg': 'Simvastatin 20mg',
      'Levothyroxine 50mcg': 'Levothyroxine 25mcg (2 tablets)',
      'Metformin 500mg': 'Metformin XR 500mg',
      'Amlodipine 5mg': 'Nifedipine XL 30mg'
    };
    return alternatives[drugName] || 'Generic Alternative Available';
  };

  const getJustification = (drugName, severity) => {
    if (severity === 'CRITICAL') {
      return `Due to critical shortage of ${drugName}, we recommend immediate substitution. The alternative has identical therapeutic effects with similar dosing profile and no significant drug interactions for most patients.`;
    } else if (severity === 'AWARENESS') {
      return `Current stock levels are concerning. The suggested alternative provides equivalent therapeutic benefits and is readily available from our supplier network.`;
    } else {
      return `Based on usage patterns and supply chain optimization, this alternative offers better availability while maintaining therapeutic equivalence.`;
    }
  };

  const handleGenerateCommunication = () => {
    onGenerateCommunication(alert.drug_name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            AI Recommendation for {alert.drug_name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">AI is analyzing alternatives...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alert Details */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Current Alert</h3>
                <p className="text-sm text-slate-700 mb-2">
                  <span className="font-medium">Severity:</span> {alert.severity}
                </p>
                <p className="text-sm text-slate-700">
                  {alert.description}
                </p>
              </div>

              {/* AI Recommendation */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">AI Recommendation</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Suggested Alternative:
                    </p>
                    <p className="text-sm text-blue-800 font-semibold">
                      {recommendation.alternative_drug}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Justification:
                    </p>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {recommendation.justification}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Close
          </button>
          <button
            onClick={handleGenerateCommunication}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
              isLoading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Generate Communication</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;