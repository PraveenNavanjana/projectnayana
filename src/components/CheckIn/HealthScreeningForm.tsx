import React, { useState } from 'react';
import { Thermometer, Shield, AlertCircle, CheckCircle, FileText, UserCheck, Printer } from 'lucide-react';
import { HealthScreening, Visitor, FamilyMember } from '../../types';
import { printService, PrintData, PrinterSettings } from '../../services/printService';

interface HealthScreeningFormProps {
  onComplete: (screening: HealthScreening) => void;
  onBack: () => void;
  visitor?: Visitor;
  familyMembers?: FamilyMember[];
}

export const HealthScreeningForm: React.FC<HealthScreeningFormProps> = ({
  onComplete,
  onBack,
  visitor,
  familyMembers = []
}) => {
  const [formData, setFormData] = useState({
    temperature: '',
    hasSymptoms: false,
    symptoms: [] as string[],
    riskFactors: [] as string[],
    // Required health screening fields
    noFeverOrCovidSymptoms: false,
    notInContactWithIll: false,
    visitorAgreementAcknowledgement: false
  });
  
  const [isPrinting, setIsPrinting] = useState(false);

  const symptomOptions = [
    'Fever or chills',
    'Cough',
    'Shortness of breath',
    'Fatigue',
    'Body aches',
    'Headache',
    'Sore throat',
    'Loss of taste or smell',
    'Nausea or vomiting',
    'Diarrhea'
  ];

  const riskFactorOptions = [
    'Age 65 or older',
    'Chronic lung disease',
    'Heart conditions',
    'Diabetes',
    'Immunocompromised',
    'Kidney disease',
    'Liver disease',
    'Other chronic conditions'
  ];

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      symptoms: checked
        ? [...prev.symptoms, symptom]
        : prev.symptoms.filter(s => s !== symptom),
      hasSymptoms: checked ? true : prev.symptoms.filter(s => s !== symptom).length > 0
    }));
  };

  const handleRiskFactorChange = (factor: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: checked
        ? [...prev.riskFactors, factor]
        : prev.riskFactors.filter(f => f !== factor)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const screening: HealthScreening = {
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      hasSymptoms: formData.hasSymptoms,
      symptoms: formData.symptoms,
      riskFactors: formData.riskFactors,
      screeningDate: new Date(),
      // Required fields
      noFeverOrCovidSymptoms: formData.noFeverOrCovidSymptoms,
      notInContactWithIll: formData.notInContactWithIll,
      visitorAgreementAcknowledgement: formData.visitorAgreementAcknowledgement,
      testResult: ''
    };

    // Start printing process
    setIsPrinting(true);
    
    try {
      console.log('🖨️ Starting printing process from Health Screening...');
      console.log('🖨️ Visitor data:', visitor);
      console.log('🖨️ Family members:', familyMembers);
      
      // Check if printing is supported
      if (!printService.isPrintingSupported()) {
        console.error('❌ Printing is not supported in this browser');
        alert('Printing is not supported in this browser. Please use the manual print buttons on the completion page.');
      } else if (visitor) {
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
            paperSize: '7x3', // 7cm x 3cm horizontal label
            orientation: 'landscape', // horizontal
            copies: 1
          }
        };
        
        console.log('🖨️ Printing main visitor thermal tag...');
        const mainVisitorSuccess = await printService.printThermalNameTag(mainVisitorPrintData);
        console.log('🖨️ Main visitor print result:', mainVisitorSuccess);
        
        // Print family member tags if any
        if (familyMembers.length > 0) {
          console.log('🖨️ Printing family member thermal tags...');
          const familyPrintSettings: PrinterSettings = {
            paperSize: '7x3',
            orientation: 'landscape',
            copies: 1
          };
          const familySuccess = await printService.printAllFamilyThermalTags(visitor, familyMembers, familyPrintSettings);
          console.log('🖨️ Family members print result:', familySuccess);
        }
        
        console.log('✅ Printing completed successfully!');
        alert('✅ Tags printed successfully! Proceeding to completion page...');
      }
    } catch (error) {
      console.error('❌ Error in printing tags:', error);
      alert('❌ Printing failed. You can still print tags manually on the completion page.');
    } finally {
      setIsPrinting(false);
    }

    // Complete the screening process
    onComplete(screening);
    
    // Refresh the page after a short delay to show the completion
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const isFormValid = formData.noFeverOrCovidSymptoms && formData.notInContactWithIll && 
    formData.visitorAgreementAcknowledgement;
  
  const hasHealthConcerns = formData.hasSymptoms || 
    (formData.temperature && parseFloat(formData.temperature) > 100.4) ||
    !formData.noFeverOrCovidSymptoms ||
    !formData.notInContactWithIll;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Health Screening</h2>
              <p className="text-sm text-gray-600">Required for facility entry</p>
            </div>
          </div>
          {hasHealthConcerns && (
            <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">Health Alert</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Health Screening Checkboxes */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Health Screening (Required)
            </h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.noFeverOrCovidSymptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, noFeverOrCovidSymptoms: e.target.checked }))}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5"
                  required
                />
                <div>
                  <span className="font-medium text-red-900">No fever or COVID symptoms in the last 48 hrs.</span>
                  <p className="text-sm text-red-700 mt-1">I confirm I have not experienced any COVID-19 symptoms in the past 48 hours.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notInContactWithIll}
                  onChange={(e) => setFormData(prev => ({ ...prev, notInContactWithIll: e.target.checked }))}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5"
                  required
                />
                <div>
                  <span className="font-medium text-red-900">Not in contact with anyone ill</span>
                  <p className="text-sm text-red-700 mt-1">I confirm I have not been in close contact with anyone who is ill or has COVID-19 symptoms.</p>
                </div>
              </label>

            </div>
          </div>

          {/* Temperature Check */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Thermometer className="w-5 h-5 text-blue-600" />
              <label className="font-medium text-gray-900">Temperature Check</label>
            </div>
            <input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={formData.temperature}
              onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-600 mt-1">Normal temperature: 97-99°F</p>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block font-medium text-gray-900 mb-3">
              Are you experiencing any of these symptoms?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {symptomOptions.map(symptom => (
                <label key={symptom} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={(e) => handleSymptomChange(symptom, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{symptom}</span>
                </label>
              ))}
            </div>
          </div>



          {/* Risk Factors */}
          <div>
            <label className="block font-medium text-gray-900 mb-3">
              Risk Factors (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {riskFactorOptions.map(factor => (
                <label key={factor} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.riskFactors.includes(factor)}
                    onChange={(e) => handleRiskFactorChange(factor, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{factor}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visitor Agreement Form Acknowledgement */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visitorAgreementAcknowledgement}
                onChange={(e) => setFormData(prev => ({ ...prev, visitorAgreementAcknowledgement: e.target.checked }))}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                required
              />
              <div>
                <span className="font-medium text-green-900">Visitor Agreement Form Acknowledgement *</span>
                <p className="text-sm text-green-700 mt-1">
                  I acknowledge that I have read and agree to follow all facility guidelines, visitor policies, and safety protocols during my visit.
                </p>
              </div>
            </label>
          </div>



          {/* Printing Status */}
          {isPrinting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Printing Name Tags...</p>
                  <p className="text-xs text-blue-700">Please wait while we print your tags</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={!isFormValid || isPrinting}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isFormValid && !isPrinting
                  ? hasHealthConcerns
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Printing Tags...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {hasHealthConcerns ? 'Continue with Caution' : 'Complete Screening'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};