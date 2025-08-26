import React from 'react';
import { Shield, Users, AlertTriangle, Settings, Clock, LogOut, User } from 'lucide-react';
import { User as UserType } from '../../types';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  emergencyMode: boolean;
  onEmergencyToggle: () => void;
  activeVisitorCount: number;
  currentUser?: UserType | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  emergencyMode,
  onEmergencyToggle,
  activeVisitorCount,
  currentUser,
  onLogout
}) => {
  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNavItems = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'super-admin':
      case 'admin':
        return [
          { id: 'admin', label: 'Admin Dashboard', icon: Shield },
          { id: 'reports', label: 'Reports', icon: Settings }
        ];
      case 'hierarchy-person':
        return [
          { id: 'hierarchy', label: 'Reports', icon: Settings }
        ];
      case 'front-desk':
        return [
          { id: 'front-desk', label: 'Dashboard', icon: Users },
          { id: 'visitor-checkin', label: 'Check In', icon: Shield }
        ];
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Users },
          { id: 'checkin', label: 'Check In', icon: Shield },
          { id: 'reports', label: 'Reports', icon: Settings }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="bg-white shadow-sm border-b-2 border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-14 h-14 bg-white rounded-lg">
              <img src="src/logo.jpg" alt="Nazareth Care Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nazareth Hospital Visitor Management</h1>
              <p className="text-sm text-gray-600">Secure Visitor System</p>
            </div>
          </div>

          {/* Navigation */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex space-x-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onViewChange(id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          )}

          {/* Status and Emergency */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {currentUser.role.replace('-', ' ')}
                </span>
              </div>
            )}

            {/* Active Visitors Count */}
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700">{activeVisitorCount} Active</span>
            </div>

            {/* Current Time */}
            <div className="hidden lg:flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{getCurrentTime()}</span>
            </div>

            {/* Emergency Button */}
            <button
              onClick={onEmergencyToggle}
              className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${
                emergencyMode
                  ? 'bg-red-600 text-white shadow-lg animate-pulse'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              {emergencyMode ? 'Emergency Active' : 'Emergency Mode'}
            </button>

            {/* Logout Button */}
            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {navItems.length > 0 && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-2">
            <div className="flex space-x-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onViewChange(id)}
                  className={`flex-1 flex flex-col items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};