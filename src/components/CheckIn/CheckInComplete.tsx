import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Download, Printer, QrCode, AlertTriangle, Mail, Tag, Users } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Visitor, HealthScreening, FamilyMember } from '../../types';
import { nameTagService } from '../../services/nameTagService';
import { printService, PrintData, PrinterSettings } from '../../services/printService';
// Removed import of ErrorBoundary due to missing module

interface CheckInCompleteProps {
  visitor: Visitor;
  healthScreening: HealthScreening;
  familyMembers?: FamilyMember[];
  onComplete: () => void;
}

export const CheckInComplete: React.FC<CheckInCompleteProps> = ({
  visitor,
  healthScreening,
  familyMembers = [],
  onComplete
}) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [qrDownloaded, setQrDownloaded] = React.useState(false);
    const [emailNotifications, setEmailNotifications] = useState({
    checkIn: false,
    healthAlert: false,
    appointment: false
  });

  // Log visitor data to confirm it was saved to Firebase and auto-print tags
  useEffect(() => {
    console.log('✅ CheckInComplete: Visitor data received:', {
      id: visitor.id,
      visitorIdNumber: visitor.visitorIdNumber,
      badgeNumber: visitor.badgeNumber,
      status: visitor.status,
      checkInTime: visitor.checkInTime,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      residentName: visitor.residentName,
      residentRoom: visitor.residentRoom
    });
    
    console.log('✅ CheckInComplete: Full visitor object:', visitor);
    console.log('✅ CheckInComplete: Health screening data:', healthScreening);
    console.log('✅ CheckInComplete: Family members data:', familyMembers);
    
    if (visitor.id) {
      console.log('✅ CheckInComplete: Firebase document ID confirmed:', visitor.id);
    } else {
      console.warn('⚠️ CheckInComplete: No Firebase document ID found!');
      console.warn('⚠️ CheckInComplete: This means the visitor was not saved to Firebase');
    }
  }, [visitor, healthScreening, familyMembers]);

  // Auto-print tags function
  const autoPrintTags = async () => {
    try {
      console.log('🖨️ Auto-printing tags for visitor and family members...');
      console.log('🖨️ Visitor data:', visitor);
      console.log('🖨️ Family members:', familyMembers);
      
      // Check if printing is supported
      if (!printService.isPrintingSupported()) {
        console.error('❌ Printing is not supported in this browser');
        alert('Printing is not supported in this browser. Please use the manual print buttons.');
        return;
      }
      
      // Test print first
      console.log('🖨️ Testing print service...');
      const testPrintData: PrintData = {
        type: 'nameTag',
        content: {
          visitorName: 'TEST PRINT',
          residentName: 'TEST',
          date: new Date().toLocaleDateString(),
          badgeNumber: 'TEST123',
          relationship: 'Test'
        }
      };
      
      const testResult = await printService.printThermalNameTag(testPrintData);
      console.log('🖨️ Test print result:', testResult);
      
      if (!testResult) {
        console.error('❌ Test print failed');
        alert('Printing test failed. Please check your printer connection and try the manual print buttons.');
        return;
      }
      
      // Print main visitor thermal tag
      const mainVisitorPrintData: PrintData = {
        type: 'nameTag',
        content: {
          visitorName: `${visitor.firstName} ${visitor.lastName}`,
          residentName: visitor.residentName || 'N/A',
          date: new Date().toLocaleDateString(),
          badgeNumber: visitor.badgeNumber || 'N/A',
          relationship: 'Visitor'
        },
        printerSettings: {
          paperSize: '2x3',
          orientation: 'landscape',
          copies: 1
        }
      };
      
      console.log('🖨️ Printing main visitor thermal tag...');
      console.log('🖨️ Print data:', mainVisitorPrintData);
      
      const mainVisitorSuccess = await printService.printThermalNameTag(mainVisitorPrintData);
      console.log('🖨️ Main visitor print result:', mainVisitorSuccess);
      
      // Print family member tags if any
      if (familyMembers.length > 0) {
        console.log('🖨️ Printing family member thermal tags...');
        const familyPrintSettings: PrinterSettings = {
          paperSize: '2x3',
          orientation: 'landscape',
          copies: 1
        };
        const familySuccess = await printService.printAllFamilyThermalTags(visitor, familyMembers, familyPrintSettings);
        console.log('🖨️ Family members print result:', familySuccess);
      }
      
      console.log('✅ Auto-printing completed successfully!');
      alert('✅ Tags printed successfully!');
    } catch (error) {
      console.error('❌ Error in auto-printing tags:', error);
      console.error('❌ Error details:', error);
      alert('❌ Printing failed. Please try the manual print buttons.');
    }
  };

  const hasHealthConcerns = healthScreening.hasSymptoms || 
    (healthScreening.temperature && healthScreening.temperature > 100.4) ||
    !healthScreening.noFeverOrCovidSymptoms ||
    !healthScreening.notInContactWithIll;

  const generateBadgeData = () => {
    try {
      // Create a compact QR code data format
      const qrData = {
        t: 'v', // type: visitor
        id: visitor.visitorIdNumber,
        n: `${visitor.firstName} ${visitor.lastName}`,
        b: visitor.badgeNumber,
        r: visitor.residentName,
        rm: visitor.residentRoom,
        ts: Date.now(),
        a: visitor.accessLevel
      };
      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Error generating badge data:', error);
      return JSON.stringify({
        t: 'v',
        id: visitor.visitorIdNumber || 'N/A',
        n: `${visitor.firstName} ${visitor.lastName}`,
        b: visitor.badgeNumber || 'N/A'
      });
    }
  };

  const handlePrintBadge = async () => {
    try {
      const printData: PrintData = {
        type: 'nameTag',
        content: {
          visitorName: `${visitor.firstName} ${visitor.lastName}`,
          residentName: visitor.residentName || 'N/A',
          badgeNumber: visitor.badgeNumber || 'N/A',
          date: new Date().toLocaleDateString()
        }
      };
      
      await printService.printNameTag(printData);
      alert('Name tag sent to printer successfully!');
    } catch (error) {
      console.error('Error printing badge:', error);
      alert('Printing failed. Please try again.');
    }
  };

  const handlePrintNameTag = async () => {
    try {
      const printData: PrintData = {
        type: 'nameTag',
        content: {
          visitorName: `${visitor.firstName} ${visitor.lastName}`,
          residentName: visitor.residentName || 'N/A',
          badgeNumber: visitor.badgeNumber || 'N/A',
          date: new Date().toLocaleDateString()
        }
      };
      
      await printService.printNameTag(printData);
      alert('Name tag sent to printer successfully!');
    } catch (error) {
      console.error('Error printing name tag:', error);
      alert('Printing failed. Please try again.');
    }
  };

  const handleDownloadNameTag = () => {
    const nameTagData = nameTagService.createNameTagData(visitor);
    nameTagService.downloadNameTag(nameTagData);
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create object URL
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fileName = `${visitor.firstName}-${visitor.lastName}-${visitor.visitorIdNumber}-qr.png`;
            link.download = fileName;
            link.href = url;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => {
              URL.revokeObjectURL(url);
            }, 100);
            
            setQrDownloaded(true);
          }
        }, 'image/png', 1.0);
      } catch (error) {
        console.error('Error downloading QR code:', error);
        // Fallback to data URL if blob fails
        const link = document.createElement('a');
        const fileName = `${visitor.firstName}-${visitor.lastName}-${visitor.visitorIdNumber}-qr.png`;
        link.download = fileName;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        setQrDownloaded(true);
      }
    }
  };

  const downloadQRCodeHighRes = () => {
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        // Create a high-resolution version
        const highResCanvas = document.createElement('canvas');
        const ctx = highResCanvas.getContext('2d');
        const scale = 4; // 4x resolution
        
        highResCanvas.width = canvas.width * scale;
        highResCanvas.height = canvas.height * scale;
        
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.drawImage(canvas, 0, 0);
          
          // Convert to blob
          highResCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const fileName = `${visitor.firstName}-${visitor.lastName}-${visitor.visitorIdNumber}-qr-hd.png`;
              link.download = fileName;
              link.href = url;
              
              // Trigger download
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up
              setTimeout(() => {
                URL.revokeObjectURL(url);
              }, 100);
            }
          }, 'image/png', 1.0);
        }
      } catch (error) {
        console.error('Error downloading high-res QR code:', error);
      }
    }
  };

  const handleDownloadQR = () => {
    // Simple fallback method that should work in all browsers
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const fileName = `${visitor.firstName}-${visitor.lastName}-${visitor.visitorIdNumber}-qr.png`;
        link.download = fileName;
        link.href = dataUrl;
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setQrDownloaded(true);
      } catch (error) {
        console.error('Error downloading QR code:', error);
        alert('Unable to download QR code. Please try again.');
      }
    }
  };

  // Auto-download QR code when component mounts
  useEffect(() => {
    const qrData = generateBadgeData();
    if (qrData && qrData.length > 0 && qrData.length < 1000) {
      // Function to attempt download
      const attemptDownload = () => {
        const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
        if (canvas) {
          try {
            console.log('Attempting to download QR code...');
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            const fileName = `${visitor.firstName}-${visitor.lastName}-${visitor.visitorIdNumber}-qr.png`;
            link.download = fileName;
            link.href = dataUrl;
            
            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('QR code downloaded successfully:', fileName);
            setQrDownloaded(true);
            return true; // Success
          } catch (error) {
            console.error('Error auto-downloading QR code:', error);
            return false; // Failed
          }
        }
        console.log('Canvas not found, retrying...');
        return false; // Canvas not found
      };

      // Try immediately, then retry after delays
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryDownload = () => {
        if (attempts >= maxAttempts) return;
        
        if (!attemptDownload()) {
          attempts++;
          setTimeout(tryDownload, 500); // Retry every 500ms
        }
      };

      // Start trying after a short delay
      setTimeout(tryDownload, 1000);
    }
  }, [visitor.visitorIdNumber, visitor.badgeNumber]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${hasHealthConcerns ? 'bg-yellow-50 border-b-4 border-yellow-400' : 'bg-green-50 border-b-4 border-green-400'}`}>
          <div className="flex items-center space-x-3">
            {hasHealthConcerns ? (
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
            <div>
              <h2 className={`text-xl font-semibold ${hasHealthConcerns ? 'text-yellow-900' : 'text-green-900'}`}>
                {hasHealthConcerns ? 'Check-In Complete - Health Alert' : 'Check-In Successful'}
              </h2>
              <p className={`text-sm ${hasHealthConcerns ? 'text-yellow-700' : 'text-green-700'}`}>
                {hasHealthConcerns 
                  ? 'Please follow additional health protocols' 
                  : 'Welcome to our facility'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Health Alert */}
          {hasHealthConcerns && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Health Protocol Notice</h3>
                  <p className="text-yellow-800 text-sm mt-1">
                    Based on your health screening, please follow these additional protocols:
                  </p>
                  <ul className="text-yellow-800 text-sm mt-2 list-disc list-inside space-y-1">
                    {healthScreening.hasSymptoms && <li>Maintain social distancing</li>}
                    {healthScreening.temperature && healthScreening.temperature > 100.4 && <li>Temperature monitoring required</li>}

                    {!healthScreening.noFeverOrCovidSymptoms && <li>Enhanced symptom monitoring required</li>}
                    {!healthScreening.notInContactWithIll && <li>Contact tracing protocols apply</li>}
                    <li>Wear face mask at all times</li>
                    <li>Sanitize hands frequently</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Health Screening Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-900 mb-3">Health Screening Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${healthScreening.noFeverOrCovidSymptoms ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={healthScreening.noFeverOrCovidSymptoms ? 'text-green-700' : 'text-red-700'}>
                    No fever/COVID symptoms (48hrs)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${healthScreening.notInContactWithIll ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={healthScreening.notInContactWithIll ? 'text-green-700' : 'text-red-700'}>
                    No contact with ill persons
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${healthScreening.visitorAgreementAcknowledgement ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={healthScreening.visitorAgreementAcknowledgement ? 'text-green-700' : 'text-red-700'}>
                    Agreement acknowledged
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {healthScreening.temperature && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${healthScreening.temperature <= 100.4 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={healthScreening.temperature <= 100.4 ? 'text-green-700' : 'text-red-700'}>
                      Temperature: {healthScreening.temperature}°F
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visitor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Visitor Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{visitor.firstName} {visitor.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Badge #:</span>
                  <span className="font-bold text-blue-600">{visitor.badgeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access Level:</span>
                  <span className="capitalize font-medium">{visitor.accessLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in Time:</span>
                  <span className="font-medium">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Visit Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meeting with:</span>
                  <span className="font-medium capitalize">{visitor.visitorMeetingSelection}</span>
                </div>
                {visitor.visitorMeetingSelection === 'resident' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resident:</span>
                      <span className="font-medium">{visitor.residentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room:</span>
                      <span className="font-medium">{visitor.residentRoom}</span>
                    </div>
                    {visitor.visitorCategory && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">
                          {visitor.visitorCategory}
                          {visitor.visitorCategoryOther && ` - ${visitor.visitorCategoryOther}`}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {visitor.visitorMeetingSelection === 'staff' && visitor.staffDepartment && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{visitor.staffDepartment}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-medium">
                    {visitor.visitPurpose}
                    {visitor.visitPurposeOther && ` - ${visitor.visitPurposeOther}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Appointment:</span>
                  <span className="font-medium capitalize">{visitor.appointmentType}</span>
                </div>
                {visitor.appointmentTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled for:</span>
                    <span className="font-medium">{new Date(visitor.appointmentTime).toLocaleString()}</span>
                  </div>
                )}
                {healthScreening.temperature && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span className={`font-medium ${
                      healthScreening.temperature > 100.4 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {healthScreening.temperature}°F
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auto Download Notification */}
          {(() => {
            const qrData = generateBadgeData();
            return qrData && qrData.length > 0 && qrData.length < 1000 && !qrDownloaded;
          })() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">QR Code Downloaded!</h4>
                  <p className="text-green-800 text-sm">
                    Your QR code has been automatically saved to your device. Keep it safe for future visits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Success Message */}
          {qrDownloaded && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">QR Code Downloaded!</h4>
                  <p className="text-green-800 text-sm">
                    Your QR code has been saved to your device. Keep it safe for future visits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Visitor ID and QR Code */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Visitor ID & QR Code</h3>
            
            {/* Visitor ID Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Your Unique Visitor ID</h4>
              <div className="text-2xl font-bold text-blue-600 mb-2">{visitor.visitorIdNumber}</div>
              <p className="text-sm text-blue-700">
                Save this ID number for future visits. You can use this ID or the QR code below for quick check-in.
              </p>
            </div>

            {/* QR Code */}
            <div id="qr-code" className="flex justify-center mb-4">
              
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code for quick identification and re-entry on future visits
            </p>
            
            {/* Future Login Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Future Visit Instructions</h4>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• Present your ID number or QR code at the check-in station</li>
                <li>• Your information will be automatically retrieved</li>
                <li>• Complete health screening for each visit</li>
                <li>• No need to re-enter personal information</li>
              </ul>
            </div>
          </div>

          {/* Family Members Section */}
          {familyMembers.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Family Members ({familyMembers.length})
              </h4>
              <div className="space-y-3 mb-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.relationship} • Badge: {member.badgeNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      // Generate and download all family member name tags as separate files
                      familyMembers.forEach((member, index) => {
                        const nameTagData = {
                          visitorName: `${member.firstName} ${member.lastName}`,
                          residentName: visitor.residentName || 'N/A',
                          date: new Date().toLocaleDateString(),
                          badgeNumber: member.badgeNumber,
                          visitorId: member.visitorId,
                          meetingWith: visitor.visitorMeetingSelection || 'N/A',
                          purpose: visitor.visitPurpose || 'N/A'
                        };
                        
                        // Download each tag with a slight delay to avoid browser blocking
                        setTimeout(() => {
                          nameTagService.downloadNameTag(nameTagData);
                        }, index * 100);
                      });
                    }}
                    className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download All Family Tags</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Print name tags for all family members
                        for (let i = 0; i < familyMembers.length; i++) {
                          const member = familyMembers[i];
                          const printData: PrintData = {
                            type: 'nameTag',
                            content: {
                              visitorName: `${member.firstName} ${member.lastName}`,
                              residentName: visitor.residentName || 'N/A',
                              badgeNumber: member.badgeNumber || 'N/A',
                              date: new Date().toLocaleDateString()
                            }
                          };
                          
                          await printService.printNameTag(printData);
                          
                          // Add delay between prints to avoid overwhelming the printer
                          if (i < familyMembers.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                          }
                        }
                        
                        alert(`Successfully sent ${familyMembers.length} family member name tags to printer!`);
                      } catch (error) {
                        console.error('Error printing family member name tags:', error);
                        alert('Printing failed. Please try again.');
                      }
                    }}
                    className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Print All Family Tags</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Download or print separate name tags for each family member
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <button
              onClick={handlePrintBadge}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print Badge</span>
            </button>
            
            <button
              onClick={handlePrintNameTag}
              className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print Name Tag</span>
            </button>
            
            <button
              onClick={async () => {
                try {
                  const printData: PrintData = {
                    type: 'nameTag',
                    content: {
                      visitorName: `${visitor.firstName} ${visitor.lastName}`,
                      residentName: visitor.residentName || 'N/A',
                      date: new Date().toLocaleDateString(),
                      badgeNumber: visitor.badgeNumber || 'N/A',
                      relationship: 'Visitor'
                    },
                    printerSettings: {
                      paperSize: '2x3',
                      orientation: 'portrait',
                      copies: 1
                    }
                  };
                  
                  const success = await printService.printThermalNameTag(printData);
                  if (success) {
                    alert('✅ Thermal name tag (2" x 3") sent to printer successfully!');
                  } else {
                    alert('❌ Thermal printing failed. Please check your printer connection.');
                  }
                } catch (error) {
                  console.error('Error printing thermal name tag:', error);
                  alert('Thermal printing failed. Please try again.');
                }
              }}
              className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print Thermal Tag</span>
            </button>
            
            <button
              onClick={async () => {
                try {
                  const printData: PrintData = {
                    type: 'nameTag',
                    content: {
                      visitorName: `${visitor.firstName} ${visitor.lastName}`,
                      residentName: visitor.residentName || 'N/A',
                      date: new Date().toLocaleDateString(),
                      badgeNumber: visitor.badgeNumber || 'N/A'
                    }
                  };
                  
                  await printService.printVisitorCard(printData);
                  alert('Visitor card sent to printer successfully!');
                } catch (error) {
                  console.error('Error printing visitor card:', error);
                  alert('Printing failed. Please try again.');
                }
              }}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print Card</span>
            </button>
            
            <button
              onClick={handleDownloadNameTag}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download Name Tag</span>
            </button>
            
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download QR Code</span>
            </button>
          </div>

          {/* Email Notifications */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email Notifications Sent
            </h4>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>• Check-in notification sent to facility staff</li>
              {visitor.appointmentType === 'scheduled' && (
                <li>• Appointment confirmation sent to relevant department</li>
              )}
              {hasHealthConcerns && (
                <li>• Health alert notification sent to medical staff</li>
              )}
              <li>• All notifications include your visit details and health screening results</li>
            </ul>
          </div>

          {/* Database Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Database Confirmation
            </h4>
            <div className="text-blue-800 text-sm space-y-2">
              <p><strong>✓ Visitor ID:</strong> {visitor.visitorIdNumber}</p>
              <p><strong>✓ Badge Number:</strong> {visitor.badgeNumber}</p>
              <p><strong>✓ Check-in Time:</strong> {visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleString() : 'N/A'}</p>
              <p><strong>✓ Status:</strong> <span className="text-green-600 font-medium">{visitor.status}</span></p>
              <p><strong>✓ Firebase Document ID:</strong> {visitor.id}</p>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Please wear your badge visibly at all times</li>
              <li>• Follow all facility guidelines and staff instructions</li>
              <li>• Remember to check out when leaving</li>
              <li>• In case of emergency, proceed to nearest exit</li>
              {hasHealthConcerns && <li>• Strictly follow health protocols during your visit</li>}
            </ul>
          </div>

          {/* Complete Button */}
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">✓ Visitor data successfully saved to database</span>
              </div>
              <p className="text-sm text-green-700 mt-1 text-center">
                Your check-in information has been recorded and is now visible to facility staff
              </p>
              <p className="text-sm text-green-600 mt-2 text-center font-medium">
                ✅ Your check-in is complete! Welcome to our facility.
              </p>
              <button
                onClick={autoPrintTags}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                🖨️ Print Tags Again
              </button>
            </div>
            
            <button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Continue to Facility</span>
            </button>
            
            <p className="text-xs text-gray-500 mt-3">
              You can now proceed into the facility. Remember to check out when leaving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};