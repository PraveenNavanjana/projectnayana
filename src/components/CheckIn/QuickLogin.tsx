import React, { useState } from 'react';
import { QrCode, User, Search, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { Visitor } from '../../types';
import { visitorService } from '../../services/visitorService';
import { QRCodeScanner } from './QRCodeScanner';

interface QuickLoginProps {
  onVisitorFound: (visitor: Visitor) => void;
  onNewVisitor: () => void;
}

export const QuickLogin: React.FC<QuickLoginProps> = ({ onVisitorFound, onNewVisitor }) => {
  const [searchMethod, setSearchMethod] = useState<'id' | 'qr'>('id');
  const [visitorIdNumber, setVisitorIdNumber] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundVisitor, setFoundVisitor] = useState<Visitor | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setFoundVisitor(null);

    try {
      let visitor: Visitor | null = null;

      if (searchMethod === 'id') {
        if (!visitorIdNumber.trim()) {
          setError('Please enter a visitor ID number');
          return;
        }
        console.log('Searching for visitor ID:', visitorIdNumber.trim());
        visitor = await visitorService.findVisitorByIdNumber(visitorIdNumber.trim());
        console.log('Search result:', visitor);
      } else {
        if (!qrCodeData.trim()) {
          setError('Please scan or enter QR code data');
          return;
        }
        console.log('Searching for QR code data:', qrCodeData.trim());
        visitor = await visitorService.findVisitorByQRCode(qrCodeData.trim());
        console.log('QR search result:', visitor);
      }

      if (visitor) {
        console.log('Setting found visitor:', visitor);
        setFoundVisitor(visitor);
      } else {
        console.log('No visitor found');
        setError('Visitor not found. Please check your ID number or QR code.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (foundVisitor) {
      onVisitorFound(foundVisitor);
    }
  };

  const handleNewVisitor = () => {
    onNewVisitor();
  };

  const handleScanSuccess = (decodedText: string) => {
    setQrCodeData(decodedText);
    setShowScanner(false);
    // Automatically search after scanning
    setTimeout(() => {
      handleSearch();
    }, 500);
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
            <Search className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick Visitor Login</h2>
            <p className="text-sm text-gray-600">Enter your ID number or scan QR code for quick check-in</p>
          </div>
        </div>

        {/* Search Method Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setSearchMethod('id')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
              searchMethod === 'id'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ID Number</span>
          </button>
          <button
            onClick={() => setSearchMethod('qr')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
              searchMethod === 'qr'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Search Form */}
        <div className="space-y-4 mb-6">
          {searchMethod === 'id' ? (
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Visitor ID Number
              </label>
              <input
                type="text"
                value={visitorIdNumber}
                onChange={(e) => setVisitorIdNumber(e.target.value)}
                placeholder="Enter your visitor ID number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                QR Code Data
              </label>
              <div className="flex space-x-2">
                <textarea
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  placeholder="Scan QR code or paste QR code data"
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleOpenScanner}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">Scan</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{loading ? 'Searching...' : 'Search Visitor'}</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Found Visitor */}
        {foundVisitor && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900 mb-2">Visitor Found!</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Name:</strong> {foundVisitor.firstName} {foundVisitor.lastName}</p>
                  <p><strong>ID:</strong> {foundVisitor.visitorIdNumber}</p>
                  <p><strong>Resident:</strong> {foundVisitor.residentName} (Room {foundVisitor.residentRoom})</p>
                  <p><strong>Last Visit:</strong> {foundVisitor.checkInTime.toLocaleDateString()}</p>
                </div>
                <button
                  onClick={handleContinue}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                >
                  Continue to Add family members
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Visitor Option */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-3">Don't have an ID number?</p>
            <button
              onClick={handleNewVisitor}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-medium"
            >
              Register as New Visitor
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}; 