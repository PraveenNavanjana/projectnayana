import React, { useState } from 'react';
import { Search, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { visitorService } from '../../services/visitorService';
import { Visitor } from '../../types';
import { CheckOutComplete } from './CheckOutComplete';

interface CheckOutFlowProps {
  onComplete: () => void;
}

export const CheckOutFlow: React.FC<CheckOutFlowProps> = ({ onComplete }) => {
  const [visitorId, setVisitorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundVisitor, setFoundVisitor] = useState<Visitor | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutComplete, setCheckOutComplete] = useState(false);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);

  const handleSearch = async () => {
    if (!visitorId.trim()) {
      setError('Please enter a visitor ID or badge number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFoundVisitor(null);

    try {
      // Search for active visitors by ID or badge number
      const activeVisitors = await visitorService.getActiveVisitors();
      
      // First, try to find the main visitor
      let visitor = activeVisitors.find(v => 
        v.visitorIdNumber === visitorId.trim() || 
        v.badgeNumber === visitorId.trim()
      );

      // If not found, check if it's a family member ID
      if (!visitor) {
        for (const v of activeVisitors) {
          if (v.familyMembers) {
            const familyMember = v.familyMembers.find(fm => 
              fm.visitorId === visitorId.trim() || 
              fm.badgeNumber === visitorId.trim()
            );
            if (familyMember) {
              // Create a visitor object for the family member
              visitor = {
                ...v,
                id: familyMember.id,
                firstName: familyMember.firstName,
                lastName: familyMember.lastName,
                visitorIdNumber: familyMember.visitorId,
                badgeNumber: familyMember.badgeNumber,
                checkInTime: familyMember.checkInTime,
                isFamilyMember: true,
                familyMemberData: familyMember
              };
              break;
            }
          }
        }
      }

      if (visitor) {
        setFoundVisitor(visitor);
      } else {
        setError('No active visitor found with this ID or badge number');
      }
    } catch (err) {
      setError('Failed to search for visitor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!foundVisitor) return;

    setIsCheckingOut(true);
    setError(null);

    try {
      if (foundVisitor.isFamilyMember && foundVisitor.familyMemberData) {
        // Check out family member
        await visitorService.checkOutVisitor(
          foundVisitor.familyMemberData.visitorId, 
          true, 
          foundVisitor.id
        );
      } else {
        // Check out main visitor
        await visitorService.checkOutVisitor(foundVisitor.id);
      }
      
      const now = new Date();
      setCheckOutTime(now);
      setCheckOutComplete(true);
      
      // Return to main page after 5 seconds
      setTimeout(() => {
        onComplete();
      }, 5000);
    } catch (err) {
      setError('Failed to check out visitor. Please try again.');
      setIsCheckingOut(false);
    }
  };

  const handleReset = () => {
    setVisitorId('');
    setError(null);
    setFoundVisitor(null);
  };

  if (checkOutComplete && foundVisitor && checkOutTime) {
    return <CheckOutComplete visitor={foundVisitor} checkOutTime={checkOutTime} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Visitor Check-Out</h2>
          <p className="text-gray-600">Enter your visitor ID or badge number to check out</p>
        </div>

        {!foundVisitor ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="visitorId" className="block text-sm font-medium text-gray-700 mb-2">
                Visitor ID or Badge Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="visitorId"
                  value={visitorId}
                  onChange={(e) => setVisitorId(e.target.value)}
                  placeholder="Enter your visitor ID or scan badge"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !visitorId.trim()}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    isLoading || !visitorId.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => onComplete()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Visitor Found</h3>
                  <div className="mt-2 text-sm text-green-700">
                    Please review your information before checking out
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Name</label>
                  <p className="text-sm text-gray-900">{foundVisitor.firstName} {foundVisitor.lastName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Badge Number</label>
                  <p className="text-sm text-gray-900">{foundVisitor.badgeNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Visitor ID</label>
                  <p className="text-sm text-gray-900">{foundVisitor.visitorIdNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-in Time</label>
                  <p className="text-sm text-gray-900">
                    {foundVisitor.checkInTime.toLocaleString()}
                  </p>
                </div>
                
                {foundVisitor.residentName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Visiting</label>
                    <p className="text-sm text-gray-900">{foundVisitor.residentName}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Purpose</label>
                  <p className="text-sm text-gray-900">{foundVisitor.visitPurpose}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleCheckOut}
                disabled={isCheckingOut}
                className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                  isCheckingOut
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Checking Out...
                  </div>
                ) : (
                  'Check Out'
                )}
              </button>
              
              <button
                onClick={handleReset}
                disabled={isCheckingOut}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Search Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 