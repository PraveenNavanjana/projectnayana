// src/components/FrontDesk/FrontDeskDashboard.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Clock, LogOut, Search, AlertTriangle, UserPlus, Download, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { Visitor } from '../../types';
import { visitorService } from '../../services/visitorService';

// Helper: Format date/time nicely for Excel
const formatDateTime = (date: Date | null) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Export to Excel function
const exportToExcel = (visitors: Visitor[], filename: string = 'Visitors_Report') => {
  const headers = ['Full Name', 'Phone Number', 'Visiting Resident', 'Room', 'Check-in Time', 'Check-out Time', 'Status', 'Visitor ID'];
  const rows = visitors.map(v => [
    v.fullName || '',
    v.phoneNumber || '',
    v.residentName || '',
    v.roomNumber || '',
    v.checkInTime ? formatDateTime(v.checkInTime) : '',
    v.checkOutTime ? formatDateTime(v.checkOutTime) : '',
    v.status || '',
    v.visitorIdNumber || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface FrontDeskDashboardProps {
  onCheckInClick: () => void;
  emergencyMode?: boolean;
  onEmergencyToggle?: () => void;
}

export const FrontDeskDashboard: React.FC<FrontDeskDashboardProps> = ({
  onCheckInClick,
  emergencyMode = false,
  onEmergencyToggle,
}) => {
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]); // Real-time active
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);       // All loaded (for date filtering)
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date()));

  useEffect(() => {
    // Real-time active visitors
    const unsubscribeActive = visitorService.subscribeToActiveVisitors((visitors) => {
      setActiveVisitors(visitors);
      setLoading(false);
    });

    // Load ALL visitors once (or you can paginate later)
    const loadAllVisitors = async () => {
      try {
        // We'll load last 30 days by default to avoid loading too much
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const all = await visitorService.getVisitorsByDateRange(thirtyDaysAgo, new Date());
        setAllVisitors(all);
      } catch (err) {
        console.error('Failed to load visitors', err);
      }
    };

    loadAllVisitors();

    return () => unsubscribeActive();
  }, []);

  // Filter visitors by selected date range
  const filteredByDate = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    return allVisitors.filter(visitor => {
      if (!visitor.checkInTime) return false;
      return isWithinInterval(visitor.checkInTime, {
        start: startOfDay(startDate),
        end: endOfDay(endDate)
      });
    });
  }, [allVisitors, startDate, endDate]);

  // Combine search + date filter
  const displayedVisitors = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return filteredByDate.filter(visitor => 
      visitor.fullName?.toLowerCase().includes(search) ||
      visitor.phoneNumber?.includes(search) ||
      visitor.residentName?.toLowerCase().includes(search) ||
      visitor.roomNumber?.toLowerCase().includes(search) ||
      visitor.visitorIdNumber?.toLowerCase().includes(search)
    );
  }, [filteredByDate, searchTerm]);

  // Stats for selected date range
  const stats = useMemo(() => {
    const total = filteredByDate.length;
    const checkedIn = filteredByDate.filter(v => v.status === 'checked-in').length;
    const checkedOut = filteredByDate.filter(v => v.status === 'checked-out' || v.status === 'emergency-evacuated').length;

    return { total, checkedIn, checkedOut };
  }, [filteredByDate]);

  const dateRangeText = startDate && endDate
    ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    : 'Select Date Range';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-16 h-16 border-8 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Emergency Banner */}
      {emergencyMode && (
        <div className="bg-red-600 text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
              <div>
                <h2 className="text-2xl font-bold">EMERGENCY MODE ACTIVE</h2>
                <p className="text-lg">All visitors must evacuate immediately</p>
              </div>
            </div>
            {onEmergencyToggle && (
              <button onClick={onEmergencyToggle} className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition">
                Deactivate Emergency
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-8 lg:px-8 xl:px-12 2xl:px-20">
        {/* Header with Date Picker */}
        <div className="mb-10 bg-white rounded-3xl shadow-xl p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Visitor History Report</h1>
              <p className="text-xl text-gray-600 mt-2">View and export visitor logs by date range</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-blue-50 px-6 py-4 rounded-2xl border-2 border-blue-200">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Date Range</p>
                  <p className="font-bold text-lg text-blue-700">{dateRangeText}</p>
                </div>
              </div>

              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update: [Date | null, Date | null]) => {
                  setStartDate(update[0]);
                  setEndDate(update[1]);
                }}
                customInput={
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-5 rounded-2xl shadow-lg flex items-center gap-3 transition-all hover:scale-105">
                    <Calendar className="w-6 h-6" />
                    Pick Date Range
                  </button>
                }
                placeholderText="Select date range"
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg font-medium">Total Visitors</p>
                <p className="text-6xl font-bold mt-3">{stats.total}</p>
              </div>
              <Users className="w-20 h-20 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-lg font-medium">Checked In</p>
                <p className="text-6xl font-bold mt-3">{stats.checkedIn}</p>
              </div>
              <Clock className="w-20 h-20 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-lg font-medium">Checked Out</p>
                <p className="text-6xl font-bold mt-3">{stats.checkedOut}</p>
              </div>
              <LogOut className="w-20 h-20 opacity-80" />
            </div>
          </div>
        </div>

        {/* Search + Export Row */}
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-between mb-10">
          <div className="flex-1 max-w-4xl">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, resident, room, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 text-xl rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none shadow-lg transition-all"
              />
            </div>
          </div>

          <button
            onClick={() => exportToExcel(displayedVisitors, `Visitors_${dateRangeText.replace(/ /g, '_')}`)}
            disabled={displayedVisitors.length === 0}
            className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-bold text-xl shadow-xl transition-all transform hover:scale-105 ${
              displayedVisitors.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download className="w-8 h-8" />
            Export Report ({displayedVisitors.length})
          </button>
        </div>

        {/* Visitors Table */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
            <h2 className="text-3xl font-bold">Visitor Log</h2>
            <p className="text-blue-100 text-lg mt-1">
              {dateRangeText} • {displayedVisitors.length} visitor{displayedVisitors.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {displayedVisitors.length === 0 ? (
            <div className="text-center py-24 px-8">
              <Users className="w-28 h-28 text-gray-300 mx-auto mb-8" />
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No visitors found in this date range
              </h3>
              <p className="text-gray-500 text-lg">Try selecting a different date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Visitor</th>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Phone</th>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Visiting</th>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Room</th>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Check-in</th>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Check-out</th>
                    <th className="text-left px-6 py-5 text-lg font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {visitor.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xl">{visitor.fullName}</div>
                            <div className="text-sm text-gray-500">ID: {visitor.visitorIdNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-gray-700 font-medium text-lg">{visitor.phoneNumber}</td>
                      <td className="px-6 py-6 text-gray-700 text-lg">{visitor.residentName || '—'}</td>
                      <td className="px-6 py-6">
                        <span className="inline-block bg-blue-100 text-blue-800 font-bold text-lg px-6 py-3 rounded-xl">
                          {visitor.roomNumber || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-gray-600 text-lg">
                        {visitor.checkInTime ? format(visitor.checkInTime, 'h:mm a') : '—'}
                      </td>
                      <td className="px-6 py-6 text-gray-600 text-lg">
                        {visitor.checkOutTime ? format(visitor.checkOutTime, 'h:mm a') : '—'}
                      </td>
                      <td className="px-6 py-6">
                        <span className={`inline-block px-5 py-2 rounded-full font-bold text-lg ${
                          visitor.status === 'checked-in' 
                            ? 'bg-green-100 text-green-800' 
                            : visitor.status === 'checked-out'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {visitor.status.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center mt-12 text-gray-500">
          <p className="text-lg">
            Real-time active: {activeVisitors.length} currently inside • Report generated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};