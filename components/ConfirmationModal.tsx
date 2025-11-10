import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope?: 'one' | 'future') => void;
  title: string;
  message: string;
  showScopeOptions?: boolean;
  occurrenceDate?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    showScopeOptions = false, 
    occurrenceDate 
}) => {
  if (!isOpen) return null;
  
  const [scope, setScope] = useState<'one' | 'future'>('future');
  
  useEffect(() => {
    // Reset scope when modal opens/changes
    if (isOpen) {
      setScope('future');
    }
  }, [isOpen]);

  const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";
  const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";


  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        {showScopeOptions && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How would you like to delete this?</h4>
              <div className="space-y-2">
                  <div className="flex items-center">
                      <input id="scope-one-del" type="radio" value="one" name="deleteScope" checked={scope === 'one'} onChange={() => setScope('one')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                      <label htmlFor="scope-one-del" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          This occurrence only
                          <span className="block text-xs text-gray-500 dark:text-gray-400">Removes the event for {occurrenceDate}.</span>
                      </label>
                  </div>
                  <div className="flex items-center">
                      <input id="scope-future-del" type="radio" value="future" name="deleteScope" checked={scope === 'future'} onChange={() => setScope('future')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                      <label htmlFor="scope-future-del" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          This and all future occurrences
                          <span className="block text-xs text-gray-500 dark:text-gray-400">Ends this recurring event from {occurrenceDate} forward.</span>
                      </label>
                  </div>
              </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className={`${btnSecondaryClasses} w-auto`}>Cancel</button>
          <button type="button" onClick={() => onConfirm(showScopeOptions ? scope : undefined)} className={`${btnDangerClasses} w-auto`}>Confirm Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;