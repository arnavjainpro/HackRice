import { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const CommunicationModal = ({ drug, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedMessage, setGeneratedMessage] = useState('');

  useEffect(() => {
    // Simulate AI message generation
    const timer = setTimeout(() => {
      setGeneratedMessage(generateMessage(drug));
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [drug]);

  // Mock AI message generation
  const generateMessage = (drugName) => {
    const currentDate = new Date().toLocaleDateString();
    
    return `Dear Healthcare Provider,

We are writing to inform you of a supply chain disruption affecting ${drugName} that may impact your patients' therapy.

CURRENT SITUATION:
Our pharmacy is experiencing a temporary shortage of ${drugName}. We anticipate this shortage may last 7-10 days based on supplier communications.

RECOMMENDED ACTION:
Our clinical team recommends considering the following therapeutic alternatives for affected patients:

• Alternative medication options are available and clinically appropriate
• No dosage adjustments required for most patients
• Similar efficacy profile with established safety data
• Coverage typically maintained under most insurance plans

NEXT STEPS:
1. Review attached patient list for those currently prescribed ${drugName}
2. Consider alternative therapy as clinically appropriate
3. We will contact patients directly regarding prescription changes
4. Our pharmacists are available for consultation on therapeutic alternatives

We understand this situation may cause inconvenience and appreciate your partnership in maintaining continuity of care for our mutual patients. Please contact our clinical team at (555) 123-4567 if you have questions or need additional information.

Thank you for your understanding and continued collaboration.

Sincerely,
RxBridge Pharmacy Network
Clinical Operations Team

Date: ${currentDate}
Reference: Supply Chain Alert #${Math.floor(Math.random() * 10000)}`;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      toast.success('Message copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Generated Message to Prescribers
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
                <p className="text-slate-600">AI is generating communication...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-1">
                <label htmlFor="generated-message" className="block text-sm font-medium text-slate-700 mb-2">
                  Generated Message:
                </label>
                <textarea
                  id="generated-message"
                  readOnly
                  value={generatedMessage}
                  className="w-full h-80 p-4 border border-slate-300 rounded-lg bg-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
              isLoading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Copy to Clipboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationModal;