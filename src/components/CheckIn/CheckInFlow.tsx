import React, { useState } from 'react';
import { VisitorForm } from './VisitorForm';
import { HealthScreeningForm } from './HealthScreeningForm';
import { FamilyMembersForm } from './FamilyMembersForm';
import { CheckInComplete } from './CheckInComplete';
import { Visitor, HealthScreening, FamilyMember } from '../../types';
import { visitorService } from '../../services/visitorService';
import { emailService } from '../../services/emailService';

interface CheckInFlowProps {
  onComplete: () => void;
  returningVisitor?: Visitor | null;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({ onComplete, returningVisitor }) => {
  const [currentStep, setCurrentStep] = useState<'visitor-info' | 'family-members' | 'health-screening' | 'complete'>(
    returningVisitor ? 'health-screening' : 'visitor-info'
  );
  const [visitorData, setVisitorData] = useState<Partial<Visitor>>(
    returningVisitor ? {
      firstName: returningVisitor.firstName,
      lastName: returningVisitor.lastName,
      email: returningVisitor.email,
      phone: returningVisitor.phone,
      relationship: returningVisitor.relationship,
      residentName: returningVisitor.residentName,
      residentRoom: returningVisitor.residentRoom,
      emergencyContact: returningVisitor.emergencyContact,
      emergencyPhone: returningVisitor.emergencyPhone,
      accessLevel: returningVisitor.accessLevel,
      photoUrl: returningVisitor.photoUrl,
      notes: returningVisitor.notes,
      visitorIdNumber: returningVisitor.visitorIdNumber
    } : {}
  );
  const [checkedInVisitor, setCheckedInVisitor] = useState<Visitor | null>(null);
  const [healthScreening, setHealthScreening] = useState<HealthScreening | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVisitorInfo = (data: Partial<Visitor>) => {
    setVisitorData(data);
    setCurrentStep('family-members');
  };

  const handleHealthScreening = async (screening: HealthScreening) => {
    console.log('🚀 handleHealthScreening called with screening:', screening);
    console.log('🚀 Current visitorData:', visitorData);
    
    setHealthScreening(screening);
    setLoading(true);
    setError(null);

    try {
      const completeVisitorData: Omit<Visitor, 'id' | 'checkInTime' | 'qrCode' | 'badgeNumber' | 'visitorIdNumber'> & { visitorIdNumber?: string } = {
        ...visitorData as Omit<Visitor, 'id' | 'checkInTime' | 'qrCode' | 'badgeNumber' | 'visitorIdNumber' | 'healthScreening'>,
        healthScreening: screening,
        status: 'checked-in',
        isApproved: true,
        visitorIdNumber: returningVisitor?.visitorIdNumber || visitorData.visitorIdNumber || undefined
      };

      console.log('🚀 Complete visitor data prepared:', completeVisitorData);
      console.log('🚀 Calling visitorService.checkInVisitor...');

      const checkedInVisitorResult = await visitorService.checkInVisitor(completeVisitorData, !!returningVisitor);
      
      console.log('🚀 visitorService.checkInVisitor returned:', checkedInVisitorResult);
      
      // Store the checked-in visitor with Firebase ID
      setCheckedInVisitor(checkedInVisitorResult);
      
      // Send email notifications
      try {
        const recipientEmail = emailService.getRecipientEmail(checkedInVisitorResult);
        
        // Send check-in notification
        await emailService.sendCheckInNotification(checkedInVisitorResult, screening, recipientEmail);
        
        // Send health alert if needed
        if (emailService.shouldSendHealthAlert(screening)) {
          await emailService.sendHealthAlertNotification(checkedInVisitorResult, screening, recipientEmail);
        }
        
        // Send appointment scheduled notification if it's a scheduled appointment
        if (checkedInVisitorResult.appointmentType === 'scheduled') {
          await emailService.sendAppointmentScheduledNotification(checkedInVisitorResult, recipientEmail);
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the check-in process if email fails
      }
      
      console.log('🚀 Moving to complete step');
      setCurrentStep('complete');
    } catch (err) {
      console.error('🚀 Error in handleHealthScreening:', err);
      setError('Failed to check in visitor. Please try again.');
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyMembers = (members: FamilyMember[]) => {
    console.log('👨‍👩‍👧‍👦 Family members added:', members);
    setFamilyMembers(members);
    setCurrentStep('health-screening');
  };

  const handleSkipFamilyMembers = () => {
    console.log('👨‍👩‍👧‍👦 Skipping family members');
    setCurrentStep('health-screening');
  };



  const handleBackToVisitorInfo = () => {
    setCurrentStep('visitor-info');
  };

  const handleBackToFamilyMembers = () => {
    setCurrentStep('family-members');
  };

  const handleComplete = () => {
    onComplete();
    // Reset the flow
    setCurrentStep('visitor-info');
    setVisitorData({});
    setCheckedInVisitor(null);
    setHealthScreening(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Check-In</h3>
          <p className="text-gray-600">Please wait while we complete your registration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  switch (currentStep) {
    case 'visitor-info':
      return <VisitorForm onNext={handleVisitorInfo} />;
    
    case 'family-members':
      return (
        <FamilyMembersForm
          onComplete={handleFamilyMembers}
          onBack={handleBackToVisitorInfo}
          onSkip={handleSkipFamilyMembers}
        />
      );
    
    case 'health-screening':
      return (
        <HealthScreeningForm
          onComplete={handleHealthScreening}
          onBack={handleBackToFamilyMembers}
          visitor={checkedInVisitor || visitorData as Visitor}
          familyMembers={familyMembers}
        />
      );
    
    case 'complete':
      return (
        <CheckInComplete
          visitor={checkedInVisitor || visitorData as Visitor}
          healthScreening={healthScreening!}
          familyMembers={familyMembers}
          onComplete={handleComplete}
        />
      );
    
    default:
      return <VisitorForm onNext={handleVisitorInfo} />;
  }
};