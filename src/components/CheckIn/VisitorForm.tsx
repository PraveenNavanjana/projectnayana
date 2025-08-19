import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, Mail, Home, Camera, UserCheck, X, Calendar, Clock } from 'lucide-react';
import { Visitor } from '../../types';

interface VisitorFormProps {
  onNext: (visitorData: Partial<Visitor>) => void;
}

export const VisitorForm: React.FC<VisitorFormProps> = ({ onNext }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    residentName: '',
    residentRoom: '',
    emergencyContact: '',
    emergencyPhone: '',
    accessLevel: 'family' as Visitor['accessLevel'],
    photoUrl: '',
    notes: '',
    visitorIdNumber: '', // New field for visitor ID number
    // New fields
    visitorMeetingSelection: '' as Visitor['visitorMeetingSelection'],
    visitorCategory: '',
    visitorCategoryOther: '',
    staffDepartment: '',
    visitPurpose: '',
    visitPurposeOther: '',
    appointmentType: 'walk-in' as Visitor['appointmentType'],
    appointmentTime: ''
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const relationshipOptions = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Grandchild',
    'Grandparent',
    'Other Family',
    'Friend',
    'Healthcare Provider',
    'Attorney',
    'Religious Leader',
    'Volunteer',
    'Contractor',
    'Other'
  ];

  const accessLevelOptions = [
    { value: 'family', label: 'Family Member', color: 'green' },
    { value: 'friend', label: 'Friend', color: 'blue' },
    { value: 'professional', label: 'Healthcare Professional', color: 'purple' },
    { value: 'volunteer', label: 'Volunteer', color: 'orange' },
    { value: 'contractor', label: 'Contractor/Service', color: 'gray' }
  ];

  // New options for visitor meeting selection
  const visitorMeetingOptions = [
    { value: 'resident', label: 'Resident' },
    { value: 'staff', label: 'Staff' },
    { value: 'sisters', label: 'Sisters' }
  ];

  const residentCategoryOptions = [
    'Power of Attorney',
    'Family Member',
    'Friend',
    'Legal Guardian',
    'Healthcare Provider',
    'Clergy/Religious Visitor',
    'Other'
  ];

  const staffDepartmentOptions = [
    'Department',
    'Nursing',
    'Maintenance',
    'Administration',
    'Accounting',
    'Kitchen',
    'Supplies'
  ];

  const visitPurposeOptions = [
    'Visit Purpose & Access',
    'Reason for Visit',
    'Personal Visit',
    'Delivery',
    'Medical Appointment',
    'Maintenance/Repair',
    'Event Attendance',
    'Spiritual Support',
    'Other'
  ];

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check camera permissions.');
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'visitor-photo.jpg', { type: 'image/jpeg' });
            setPhotoFile(file);
            setFormData(prev => ({ ...prev, photoUrl: URL.createObjectURL(blob) }));
          }
        }, 'image/jpeg', 0.8);
      }
      
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const isFormValid = formData.firstName && formData.lastName && formData.phone && 
    formData.visitorIdNumber && formData.visitorMeetingSelection && formData.visitPurpose &&
    formData.emergencyContact && formData.emergencyPhone &&
    (formData.visitorMeetingSelection !== 'resident' || (formData.residentName && formData.residentRoom));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Visitor Information</h2>
            <p className="text-sm text-gray-600">Please provide your details for check-in</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Capture */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <label className="font-medium text-gray-900">Visitor Photo</label>
              </div>
              <span className="text-xs text-gray-500">Required for badge</span>
            </div>
            
            {isCapturing ? (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {formData.photoUrl && (
                  <img
                    src={formData.photoUrl}
                    alt="Visitor photo"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="font-medium">
                      {formData.photoUrl ? 'Retake Photo' : 'Take Photo'}
                    </span>
                  </button>
                  <label className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer border border-gray-200">
                    <Camera className="w-4 h-4" />
                    <span className="font-medium">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Appointment Type */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Appointment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Appointment Type *
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'scheduled', label: 'Scheduled Appointment' },
                    { value: 'walk-in', label: 'Walk-in (Unannounced)' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200">
                      <input
                        type="radio"
                        name="appointmentType"
                        value={option.value}
                        checked={formData.appointmentType === option.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, appointmentType: e.target.value as Visitor['appointmentType'] }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.appointmentType === 'scheduled' && (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Appointment Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Visitor Meeting Selection */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-3 flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Visitor Meeting Selection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Who are you meeting with? *
                </label>
                <select
                  value={formData.visitorMeetingSelection}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visitorMeetingSelection: e.target.value as Visitor['visitorMeetingSelection'],
                    visitorCategory: '',
                    staffDepartment: ''
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select who you're meeting with</option>
                  {visitorMeetingOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Conditional fields based on selection */}
              {formData.visitorMeetingSelection === 'resident' && (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Resident Visitor Category
                  </label>
                  <select
                    value={formData.visitorCategory}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      visitorCategory: e.target.value,
                      visitorCategoryOther: e.target.value === 'Other' ? prev.visitorCategoryOther : ''
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {residentCategoryOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formData.visitorCategory === 'Other' && (
                    <input
                      type="text"
                      value={formData.visitorCategoryOther}
                      onChange={(e) => setFormData(prev => ({ ...prev, visitorCategoryOther: e.target.value }))}
                      placeholder="Please specify"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                    />
                  )}
                </div>
              )}

              {formData.visitorMeetingSelection === 'staff' && (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Staff Department
                  </label>
                  <select
                    value={formData.staffDepartment}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffDepartment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select department</option>
                    {staffDepartmentOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Visit Purpose */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Visit Purpose
            </h3>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Purpose of Visit *
              </label>
              <select
                value={formData.visitPurpose}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  visitPurpose: e.target.value,
                  visitPurposeOther: e.target.value === 'Other' ? prev.visitPurposeOther : ''
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select visit purpose</option>
                {visitPurposeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {formData.visitPurpose === 'Other' && (
                <input
                  type="text"
                  value={formData.visitPurposeOther}
                  onChange={(e) => setFormData(prev => ({ ...prev, visitPurposeOther: e.target.value }))}
                  placeholder="Please specify the purpose of your visit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* ID Number */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                ID Number *
              </label>
              <input
                type="text"
                value={formData.visitorIdNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, visitorIdNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your government-issued ID number"
                required
              />
            </div>
          </div>

          {/* Resident Information (only show if meeting with resident) */}
          {formData.visitorMeetingSelection === 'resident' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Resident Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Resident Name *
                  </label>
                  <input
                    type="text"
                    value={formData.residentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, residentName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={formData.residentRoom}
                    onChange={(e) => setFormData(prev => ({ ...prev, residentRoom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A-101"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Access Level */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Access Level
            </label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value as Visitor['accessLevel'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {accessLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Emergency Contact */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-900 mb-3">
              Emergency Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special instructions or notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isFormValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Continue to Health Screening</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};