import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Users, TrendingUp, AlertTriangle, Printer } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Visitor } from '../../types';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { printService, PrintData } from '../../services/printService';

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState<{
    totalVisits: number;
    uniqueVisitors: number;
    avgVisitDuration: number;
    healthAlerts: number;
    visitorsByAccessLevel: Record<string, number>;
    visitorsByDay: Record<string, number>;
    recentVisitors: Visitor[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(new Date(dateRange.start));
      const endDate = endOfDay(new Date(dateRange.end));

      const q = query(
        collection(db, 'visitors'),
        where('checkInTime', '>=', Timestamp.fromDate(startDate)),
        where('checkInTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('checkInTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const visitors = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
        healthScreening: {
          ...doc.data().healthScreening,
          screeningDate: doc.data().healthScreening.screeningDate.toDate()
        }
      })) as Visitor[];

      // Calculate statistics
      const totalVisits = visitors.length;
      const uniqueVisitors = new Set(visitors.map(v => `${v.firstName} ${v.lastName}`)).size;
      
      const completedVisits = visitors.filter(v => v.checkOutTime);
      const avgVisitDuration = completedVisits.length > 0
        ? completedVisits.reduce((sum, v) => {
            const duration = v.checkOutTime!.getTime() - v.checkInTime.getTime();
            return sum + duration;
          }, 0) / completedVisits.length / (1000 * 60) // Convert to minutes
        : 0;

      const healthAlerts = visitors.filter(v =>
        v.healthScreening.hasSymptoms ||
        (v.healthScreening.temperature && v.healthScreening.temperature > 100.4) ||
        v.healthScreening.testResult === 'positive'
      ).length;

      const visitorsByAccessLevel = visitors.reduce((acc, v) => {
        acc[v.accessLevel] = (acc[v.accessLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const visitorsByDay = visitors.reduce((acc, v) => {
        const day = format(v.checkInTime, 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setReportData({
        totalVisits,
        uniqueVisitors,
        avgVisitDuration,
        healthAlerts,
        visitorsByAccessLevel,
        visitorsByDay,
        recentVisitors: visitors.slice(0, 10)
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const downloadReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Visitor Management Report'],
      [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`],
      [`Period: ${dateRange.start} to ${dateRange.end}`],
      [''],
      ['Summary Statistics'],
      [`Total Visits,${reportData.totalVisits}`],
      [`Unique Visitors,${reportData.uniqueVisitors}`],
      [`Average Visit Duration (minutes),${reportData.avgVisitDuration.toFixed(1)}`],
      [`Health Alerts,${reportData.healthAlerts}`],
      [''],
      ['Recent Visitors'],
      ['Name', 'Resident', 'Room', 'Check In', 'Check Out', 'Access Level', 'Health Status'],
      ...reportData.recentVisitors.map(v => [
        `${v.firstName} ${v.lastName}`,
        v.residentName,
        v.residentRoom,
        format(v.checkInTime, 'yyyy-MM-dd HH:mm'),
        v.checkOutTime ? format(v.checkOutTime, 'yyyy-MM-dd HH:mm') : 'Still visiting',
        v.accessLevel,
        v.healthScreening.hasSymptoms || 
        (v.healthScreening.temperature && v.healthScreening.temperature > 100.4) ||
        v.healthScreening.testResult === 'positive' ? 'Alert' : 'Normal'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitor-report-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = async () => {
    if (!reportData) return;

    try {
      const reportHTML = `
        <div class="section">
          <h2 class="section-title">Summary Statistics</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Total Visits</div>
              <div class="info-value">${reportData.totalVisits}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Unique Visitors</div>
              <div class="info-value">${reportData.uniqueVisitors}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Average Visit Duration</div>
              <div class="info-value">${reportData.avgVisitDuration.toFixed(1)} minutes</div>
            </div>
            <div class="info-item">
              <div class="info-label">Health Alerts</div>
              <div class="info-value">${reportData.healthAlerts}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Access Level Distribution</h2>
          <div class="info-grid">
            ${Object.entries(reportData.visitorsByAccessLevel).map(([level, count]) => `
              <div class="info-item">
                <div class="info-label">${level}</div>
                <div class="info-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Recent Visitors</h2>
          <div class="info-grid">
            ${reportData.recentVisitors.map(v => `
              <div class="info-item">
                <div class="info-label">${v.firstName} ${v.lastName}</div>
                <div class="info-value">
                  ${v.residentName} (Room ${v.residentRoom})<br>
                  Check-in: ${format(v.checkInTime, 'MMM dd, HH:mm')}<br>
                  Status: ${v.status}<br>
                  Health: ${v.healthScreening.hasSymptoms || 
                    (v.healthScreening.temperature && v.healthScreening.temperature > 100.4) ||
                    v.healthScreening.testResult === 'positive' ? 'Alert' : 'Normal'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const printData: PrintData = {
        type: 'report',
        content: {
          title: `Visitor Management Report - ${dateRange.start} to ${dateRange.end}`,
          date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          html: reportHTML
        }
      };

      const success = await printService.printReport(printData);
      if (success) {
        alert('Report sent to printer successfully!');
      } else {
        alert('Printing failed. Please try again or check your printer connection.');
      }
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Printing failed. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Visitor management insights and compliance reports</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.totalVisits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.uniqueVisitors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Visit Duration</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reportData.avgVisitDuration.toFixed(0)}m
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className={`w-8 h-8 ${reportData.healthAlerts > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Health Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.healthAlerts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Access Level Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitors by Access Level</h3>
              <div className="space-y-3">
                {Object.entries(reportData.visitorsByAccessLevel).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="capitalize text-gray-700">{level}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / reportData.totalVisits) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Visit Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Visit Trend</h3>
              <div className="space-y-3">
                {Object.entries(reportData.visitorsByDay)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-7)
                  .map(([date, count]) => (
                    <div key={date} className="flex items-center justify-between">
                      <span className="text-gray-700">{format(new Date(date), 'MMM dd')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(reportData.visitorsByDay))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Visitors Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Visitors</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={printReport}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resident
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.recentVisitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {visitor.firstName} {visitor.lastName}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {visitor.accessLevel}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{visitor.residentName}</div>
                        <div className="text-sm text-gray-500">Room {visitor.residentRoom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(visitor.checkInTime, 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          visitor.status === 'checked-in' 
                            ? 'bg-green-100 text-green-800'
                            : visitor.status === 'checked-out'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {visitor.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visitor.healthScreening.hasSymptoms ||
                        (visitor.healthScreening.temperature && visitor.healthScreening.temperature > 100.4) ||
                        visitor.healthScreening.testResult === 'positive' ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Alert
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">
            No visitor data found for the selected date range. Try selecting a different period.
          </p>
        </div>
      )}
    </div>
  );
};