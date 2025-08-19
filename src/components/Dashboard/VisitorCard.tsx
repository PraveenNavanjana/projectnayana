import React from 'react';
import { Clock, MapPin, Phone, AlertCircle, CheckCircle, LogOut, Shield } from 'lucide-react';
import { Visitor } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface VisitorCardProps {
  visitor: Visitor;
  onCheckOut: (visitorId: string) => void;
  emergencyMode: boolean;
}

export const VisitorCard: React.FC<VisitorCardProps> = ({
  visitor,
  onCheckOut,
  emergencyMode
}) => {
  const getAccessLevelColor = (level: Visitor['accessLevel']) => {
    const colors = {
      family: 'bg-green-100 text-green-800 border-green-200',
      friend: 'bg-blue-100 text-blue-800 border-blue-200',
      professional: 'bg-purple-100 text-purple-800 border-purple-200',
      volunteer: 'bg-orange-100 text-orange-800 border-orange-200',
      contractor: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[level] || colors.family;
  };

  const getHealthStatus = () => {
    const { healthScreening } = visitor;
    const hasSymptoms = healthScreening.hasSymptoms;
    const highTemp = healthScreening.temperature && healthScreening.temperature > 100.4;
    const positiveTest = healthScreening.testResult === 'positive';

    if (hasSymptoms || highTemp || positiveTest) {
      return { status: 'warning', icon: AlertCircle, text: 'Health Alert' };
    }
    return { status: 'good', icon: CheckCircle, text: 'Cleared' };
  };

  const healthStatus = getHealthStatus();
  const timeInFacility = formatDistanceToNow(visitor.checkInTime, { addSuffix: true });

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 transition-all hover:shadow-lg ${
      emergencyMode ? 'border-l-red-500' : 'border-l-blue-500'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {visitor.photoUrl ? (
              <img
                src={visitor.photoUrl}
                alt={`${visitor.firstName} ${visitor.lastName}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {visitor.firstName} {visitor.lastName}
              </h3>
              <p className="text-gray-600">{visitor.relationship}</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAccessLevelColor(visitor.accessLevel)}`}>
                {visitor.accessLevel.charAt(0).toUpperCase() + visitor.accessLevel.slice(1)}
              </div>
            </div>
          </div>

          {/* Badge Number */}
          <div className="text-right">
            <div className="bg-blue-50 px-3 py-1 rounded-lg">
              <span className="text-xs text-blue-600 font-medium">Badge</span>
              <p className="text-sm font-bold text-blue-800">{visitor.badgeNumber}</p>
            </div>
          </div>
        </div>

        {/* Resident Information */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">Visiting:</span>
          </div>
          <p className="text-gray-700">{visitor.residentName}</p>
          <p className="text-sm text-gray-600">Room {visitor.residentRoom}</p>
        </div>

        {/* Health Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <healthStatus.icon className={`w-5 h-5 ${
              healthStatus.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
            }`} />
            <span className={`font-medium ${
              healthStatus.status === 'warning' ? 'text-yellow-800' : 'text-green-800'
            }`}>
              Health: {healthStatus.text}
            </span>
          </div>
          
          {visitor.healthScreening.temperature && (
            <span className={`text-sm px-2 py-1 rounded ${
              visitor.healthScreening.temperature > 100.4 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {visitor.healthScreening.temperature}°F
            </span>
          )}
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Checked in {timeInFacility}</span>
          </div>
          <div className="text-sm text-gray-500">
            {visitor.checkInTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>{visitor.phone}</span>
          </div>
        </div>

        {/* Emergency Mode Warning or Check Out Button */}
        {emergencyMode ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Emergency Mode Active</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Visitor location being tracked for evacuation procedures
            </p>
          </div>
        ) : (
          <button
            onClick={() => onCheckOut(visitor.id)}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Check Out</span>
          </button>
        )}

        {/* Notes */}
        {visitor.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {visitor.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};