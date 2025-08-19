import React, { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, Clock, Search, AlertTriangle, Database } from 'lucide-react';
import { Visitor } from '../../types';
import { visitorService } from '../../services/visitorService';

interface FrontDeskDashboardProps {
  onCheckInClick: () => void;
  emergencyMode?: boolean;
  onEmergencyToggle?: () => void;
}

export const FrontDeskDashboard: React.FC<FrontDeskDashboardProps> = ({
  onCheckInClick,
  emergencyMode = false,
  onEmergencyToggle
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [allVisitorsToday, setAllVisitorsToday] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Subscribe to active visitors (currently inside)
    const unsubscribeActive = visitorService.subscribeToActiveVisitors((activeVisitors) => {
      console.log('Front Desk Dashboard received visitors:', activeVisitors);
      setVisitors(activeVisitors);
      setLoading(false);
    });

    // Get all visitors for today (including checked out ones)
    const fetchTodayVisitors = async () => {
      try {
        const todayVisitors = await visitorService.getTodayVisitors();
        console.log('Front Desk Dashboard fetched today visitors:', todayVisitors);
        setAllVisitorsToday(todayVisitors);
      } catch (error) {
        console.error('Error fetching today\'s visitors:', error);
        setDebugInfo(`Error fetching visitors: ${error}`);
      }
    };

    fetchTodayVisitors();

    return () => {
      unsubscribeActive();
    };
  }, []);

  const handleCheckOut = async (visitorId: string) => {
    try {
      await visitorService.checkOutVisitor(visitorId);
      // The subscription will automatically update the UI
    } catch (error) {
      console.error('Error checking out visitor:', error);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      setDebugInfo('Testing database connection...');
      const result = await visitorService.testDatabaseConnection();
      if (result.success) {
        setDebugInfo(result.message);
      } else {
        setDebugInfo(result.message);
      }
    } catch (error) {
      setDebugInfo(`Database connection failed: ${error}`);
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    if (!searchTerm) return true;
    
    return (
      `${visitor.firstName} ${visitor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.residentRoom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate statistics from database data
  const stats = {
    totalToday: allVisitorsToday.length,
    currentlyInside: visitors.length, // Active visitors from subscription
    leftToday: allVisitorsToday.filter(v => v.checkOutTime).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">EMERGENCY MODE ACTIVE</h3>
                <p className="text-sm opacity-90">All visitors are being tracked for evacuation</p>
              </div>
            </div>
            {onEmergencyToggle && (
              <button
                onClick={onEmergencyToggle}
                className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50"
              >
                Exit Emergency Mode
              </button>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <strong>Debug Info:</strong> {debugInfo}
              </div>
            </div>
            <button
              onClick={() => setDebugInfo('')}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header with Counts */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Front Desk Dashboard</h1>
            <p className="text-gray-600">Visitor Management System - Real-time Data from Database</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={testDatabaseConnection}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Test DB</span>
            </button>
            <button
              onClick={onCheckInClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>New Check-in</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Today</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalToday}</p>
                <p className="text-xs text-blue-500">From database</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Currently Inside</p>
                <p className="text-2xl font-bold text-green-900">{stats.currentlyInside}</p>
                <p className="text-xs text-green-500">Real-time count</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Left Today</p>
                <p className="text-2xl font-bold text-purple-900">{stats.leftToday}</p>
                <p className="text-xs text-purple-500">Checked out</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitors, residents, or room numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Visitors (Currently Inside)</h3>
          <p className="text-sm text-gray-500">Real-time data from Firebase database</p>
        </div>
        
        {filteredVisitors.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching visitors' : 'No active visitors'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Visitors will appear here after checking in'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={onCheckInClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <UserPlus className="w-5 h-5" />
                <span>Start First Check-in</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {visitor.firstName.charAt(0)}{visitor.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {visitor.firstName} {visitor.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {visitor.visitPurpose || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {visitor.visitorIdNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {visitor.visitorMeetingSelection || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visitor.residentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visitor.residentRoom || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleCheckOut(visitor.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Check Out</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Data is automatically synchronized with Firebase database in real-time</p>
        <p>Check-ins and check-outs are stored with timestamps for accurate tracking</p>
        <p className="mt-2 text-xs">Check browser console for detailed debugging information</p>
      </div>
    </div>
  );
}; 