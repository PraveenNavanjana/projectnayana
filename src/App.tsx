import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CheckInFlow } from './components/CheckIn/CheckInFlow';
import { CheckOutFlow } from './components/CheckOut/CheckOutFlow';
import { Reports } from './components/Reports/Reports';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { FrontDeskDashboard } from './components/FrontDesk/FrontDeskDashboard';
import { visitorService } from './services/visitorService';
import { authService } from './services/authService';
import { User, Visitor } from './types';

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkInMode, setCheckInMode] = useState<'check-in' | 'check-out' | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeVisitorCount, setActiveVisitorCount] = useState(0);
  const [returningVisitor, setReturningVisitor] = useState<Visitor | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize auth service and check if user is already logged in
    const initializeAuth = async () => {
      try {
        // Wait a bit for Firebase to initialize and default users to be created
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Redirect to appropriate dashboard based on role
          const defaultPath = getDefaultPathForUser(user);
          if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
            navigate(defaultPath);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };
    
    initializeAuth();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const unsubscribe = visitorService.subscribeToActiveVisitors((visitors) => {
      setActiveVisitorCount(visitors.length);
    });

    return () => unsubscribe();
  }, []);

  const getDefaultPathForUser = (user: User): string => {
    switch (user.role) {
      case 'super-admin':
      case 'admin':
        return '/admin';
      case 'hierarchy-person':
        return '/hierarchy';
      case 'front-desk':
        return '/front-desk';
      default:
        return '/login';
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const defaultPath = getDefaultPathForUser(user);
    navigate(defaultPath);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      navigate('/');
      setCheckInMode(null);
      setReturningVisitor(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEmergencyToggle = () => {
    setEmergencyMode(!emergencyMode);
  };

  const handleEmergencyEvacuation = async (visitorIds: string[]) => {
    try {
      await visitorService.emergencyEvacuation(visitorIds);
      alert(`Emergency evacuation completed for ${visitorIds.length} visitors.`);
    } catch (error) {
      console.error('Emergency evacuation failed:', error);
      alert('Emergency evacuation failed. Please try again.');
    }
  };

  const handleCheckInComplete = () => {
    if (currentUser?.role === 'front-desk') {
      navigate('/front-desk');
    } else {
      navigate('/');
    }
    setCheckInMode(null);
    setReturningVisitor(null);
  };

  const handleCheckIn = () => {
    setCheckInMode('check-in');
  };

  const handleCheckOut = () => {
    setCheckInMode('check-out');
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'super-admin') {
      return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
  };

  // Login Component
  const LoginPage = () => (
    <Login 
      onLoginSuccess={handleLoginSuccess} 
      onBackToCheckIn={() => navigate('/')}
      onNavigateToSignup={() => navigate('/signup')}
    />
  );

  // Signup Component
  const SignupPage = () => (
    <Signup onBackToLogin={() => navigate('/login')} />
  );

  // Admin Dashboard Component
  const AdminPage = () => (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard currentUser={currentUser!} onLogout={handleLogout} />
    </ProtectedRoute>
  );

  // Front Desk Dashboard Component
  const FrontDeskPage = () => (
    <ProtectedRoute requiredRole="front-desk">
      <div className="min-h-screen bg-gray-50">
        <Header
          currentView="front-desk"
          onViewChange={() => {}}
          emergencyMode={emergencyMode}
          onEmergencyToggle={handleEmergencyToggle}
          activeVisitorCount={activeVisitorCount}
          currentUser={currentUser!}
          onLogout={handleLogout}
        />
        
        <main className="py-6">
          <FrontDeskDashboard
            onCheckInClick={() => navigate('/')}
            emergencyMode={emergencyMode}
            onEmergencyToggle={handleEmergencyToggle}
          />
        </main>
      </div>
    </ProtectedRoute>
  );

  // Hierarchy Dashboard Component
  const HierarchyPage = () => (
    <ProtectedRoute requiredRole="hierarchy-person">
      <div className="min-h-screen bg-gray-50">
        <Header
          currentView="hierarchy"
          onViewChange={() => {}}
          emergencyMode={emergencyMode}
          onEmergencyToggle={handleEmergencyToggle}
          activeVisitorCount={activeVisitorCount}
          currentUser={currentUser!}
          onLogout={handleLogout}
        />
        
        <main className="py-6">
          <Reports />
        </main>
      </div>
    </ProtectedRoute>
  );

  // Visitor Check-in Page Component
  const VisitorCheckInPage = () => {
    if (checkInMode === 'check-in') {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header
            currentView="checkin"
            onViewChange={() => {}}
            emergencyMode={emergencyMode}
            onEmergencyToggle={handleEmergencyToggle}
            activeVisitorCount={activeVisitorCount}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          
          <main className="py-6">
            <CheckInFlow
              onComplete={handleCheckInComplete}
              returningVisitor={returningVisitor}
            />
          </main>
        </div>
      );
    }

    if (checkInMode === 'check-out') {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header
            currentView="checkout"
            onViewChange={() => {}}
            emergencyMode={emergencyMode}
            onEmergencyToggle={handleEmergencyToggle}
            activeVisitorCount={activeVisitorCount}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          
          <main className="py-6">
            <CheckOutFlow onComplete={() => setCheckInMode(null)} />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          currentView="visitor-checkin"
          onViewChange={() => {}}
          emergencyMode={emergencyMode}
          onEmergencyToggle={handleEmergencyToggle}
          activeVisitorCount={activeVisitorCount}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        <main className="py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Visitor Management</h2>
                <p className="text-gray-600">Check in or check out of the facility</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={handleCheckIn}
                  className="flex flex-col items-center p-6 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Check In</h3>
                  <p className="text-sm text-gray-600">Complete visitor registration and check-in process</p>
                </button>
                
                <button
                  onClick={handleCheckOut}
                  className="flex flex-col items-center p-6 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Out</h3>
                  <p className="text-sm text-gray-600">Complete your visit and check out</p>
                </button>
              </div>
              
              {/* Staff Login Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">Staff and administrators</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Staff Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<VisitorCheckInPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/front-desk" element={<FrontDeskPage />} />
        <Route path="/hierarchy" element={<HierarchyPage />} />
      </Routes>

      {/* Emergency Mode Overlay */}
      {emergencyMode && (
        <div className="fixed inset-0 bg-red-600 bg-opacity-10 pointer-events-none z-40">
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                <span className="font-semibold">EMERGENCY MODE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;