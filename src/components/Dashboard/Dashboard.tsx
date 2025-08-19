import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertTriangle, TrendingUp, Search, Filter, UserPlus } from 'lucide-react';
import { VisitorCard } from './VisitorCard';
import { Visitor } from '../../types';
import { visitorService } from '../../services/visitorService';

interface DashboardProps {
  emergencyMode: boolean;
  onEmergencyEvacuation: (visitorIds: string[]) => void;
  showCheckInButton?: boolean;
  onCheckInClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  emergencyMode,
  onEmergencyEvacuation,
  showCheckInButton = false,
  onCheckInClick
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'family' | 'professional' | 'warning'>('all');

  useEffect(() => {
    const unsubscribe = visitorService.subscribeToActiveVisitors((activeVisitors) => {
      setVisitors(activeVisitors);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCheckOut = async (visitorId: string) => {
    try {
      await visitorService.checkOutVisitor(visitorId);
    } catch (error) {
      console.error('Error checking out visitor:', error);
    }
  };

  const handleEmergencyEvacuation = () => {
    const visitorIds = visitors.map(v => v.id);
    onEmergencyEvacuation(visitorIds);
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = searchTerm === '' || 
      `${visitor.firstName} ${visitor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.residentRoom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'family' && visitor.accessLevel === 'family') ||
      (filterBy === 'professional' && visitor.accessLevel === 'professional') ||
      (filterBy === 'warning' && (
        visitor.healthScreening.hasSymptoms || 
        (visitor.healthScreening.temperature && visitor.healthScreening.temperature > 100.4) ||
        visitor.healthScreening.testResult === 'positive'
      ));

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: visitors.length,
    family: visitors.filter(v => v.accessLevel === 'family').length,
    professional: visitors.filter(v => v.accessLevel === 'professional').length,
    healthAlerts: visitors.filter(v => 
      v.healthScreening.hasSymptoms || 
      (v.healthScreening.temperature && v.healthScreening.temperature > 100.4) ||
      v.healthScreening.testResult === 'positive'
    ).length
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
      {/* Emergency Alert */}
      {emergencyMode && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Emergency Mode Active</h3>
                <p className="text-sm opacity-90">All visitors are being tracked for evacuation</p>
              </div>
            </div>
            <button
              onClick={handleEmergencyEvacuation}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50"
            >
              Evacuate All Visitors
            </button>
          </div>
        </div>
      )}

      {/* Check-in Button for Front Desk */}
      {showCheckInButton && onCheckInClick && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Ready to Check-in Visitors?</h3>
                <p className="text-sm text-blue-700">Start the visitor check-in process</p>
              </div>
            </div>
            <button
              onClick={onCheckInClick}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Check-in
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Visitors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Family Visitors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.family}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Professionals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.professional}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className={`w-8 h-8 ${stats.healthAlerts > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Health Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.healthAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Visitors</option>
              <option value="family">Family Only</option>
              <option value="professional">Professionals</option>
              <option value="warning">Health Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitors Grid */}
      {filteredVisitors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterBy !== 'all' ? 'No matching visitors' : 'No active visitors'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Visitors will appear here after checking in'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVisitors.map((visitor) => (
            <VisitorCard
              key={visitor.id}
              visitor={visitor}
              onCheckOut={handleCheckOut}
              emergencyMode={emergencyMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};