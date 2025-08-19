import React, { useState } from 'react';
import { Users, UserPlus, X, User } from 'lucide-react';
import { FamilyMember } from '../../types';

interface FamilyMembersFormProps {
  onComplete: (familyMembers: FamilyMember[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

export const FamilyMembersForm: React.FC<FamilyMembersFormProps> = ({
  onComplete,
  onBack,
  onSkip
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentMember, setCurrentMember] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    age: '',
    phone: '',
    email: ''
  });

  const relationshipOptions = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Grandchild',
    'Grandparent',
    'Other Family',
    'Friend',
    'Other'
  ];

  const handleAddMember = () => {
    if (!currentMember.firstName || !currentMember.lastName || !currentMember.relationship) {
      console.log('⚠️ Family member form validation failed:', currentMember);
      return;
    }

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      firstName: currentMember.firstName,
      lastName: currentMember.lastName,
      relationship: currentMember.relationship,
      age: currentMember.age ? parseInt(currentMember.age) : undefined,
      phone: currentMember.phone || undefined,
      email: currentMember.email || undefined,
      badgeNumber: `FM${Date.now()}`, // Generate badge number
      visitorId: `FM${Date.now()}`, // Generate visitor ID
      checkInTime: new Date()
    };

    console.log('👨‍👩‍👧‍👦 Adding family member:', newMember);
    setFamilyMembers([...familyMembers, newMember]);
    setCurrentMember({
      firstName: '',
      lastName: '',
      relationship: '',
      age: '',
      phone: '',
      email: ''
    });
    setShowAddForm(false);
  };

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleComplete = () => {
    console.log('👨‍👩‍👧‍👦 Completing family members form with:', familyMembers);
    onComplete(familyMembers);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Family Members</h2>
              <p className="text-sm text-gray-600">Add family members visiting with you</p>
            </div>
          </div>
        </div>

        {familyMembers.length === 0 && !showAddForm ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members Added</h3>
            <p className="text-gray-600 mb-6">
              Are you visiting with family members? Add them to get separate name tags.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Family Member</span>
              </button>
              <button
                onClick={onSkip}
                className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Skip - No Family Members
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Family Members List */}
            {familyMembers.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Family Members ({familyMembers.length})</h3>
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.relationship}
                            {member.age && ` • Age ${member.age}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Family Member Form */}
            {showAddForm && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-900 mb-3">Add Family Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={currentMember.firstName}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={currentMember.lastName}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <select
                      value={currentMember.relationship}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, relationship: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select relationship</option>
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={currentMember.age}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter age"
                      min="0"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={currentMember.phone}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={currentMember.email}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={handleAddMember}
                    disabled={!currentMember.firstName || !currentMember.lastName || !currentMember.relationship}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      !currentMember.firstName || !currentMember.lastName || !currentMember.relationship
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Add Member
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add More Button */}
            {!showAddForm && familyMembers.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-purple-100 text-purple-700 py-3 px-4 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Another Family Member</span>
              </button>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Back
              </button>
              
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 