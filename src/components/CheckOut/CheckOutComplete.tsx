import React from 'react';
import { CheckCircle, Clock, User } from 'lucide-react';
import { Visitor } from '../../types';

interface CheckOutCompleteProps {
  visitor: Visitor;
  checkOutTime: Date;
}

export const CheckOutComplete: React.FC<CheckOutCompleteProps> = ({ visitor, checkOutTime }) => {
  const visitDuration = Math.round(
    (checkOutTime.getTime() - visitor.checkInTime.getTime()) / (1000 * 60)
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Check-Out Complete</h2>
          <p className="text-gray-600">Thank you for visiting!</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Visitor Name</label>
              <p className="text-sm text-gray-900 font-medium">{visitor.firstName} {visitor.lastName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Badge Number</label>
              <p className="text-sm text-gray-900">{visitor.badgeNumber}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Check-in Time</label>
              <p className="text-sm text-gray-900">{visitor.checkInTime.toLocaleString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Check-out Time</label>
              <p className="text-sm text-gray-900">{checkOutTime.toLocaleString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Visit Duration</label>
              <p className="text-sm text-gray-900">{visitDuration} minutes</p>
            </div>
            
            {visitor.residentName && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Visited</label>
                <p className="text-sm text-gray-900">{visitor.residentName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Please return your visitor badge and have a great day!
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>Thank you for visiting our facility</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 