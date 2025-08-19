# Firebase Setup Guide

## Overview
This application now uses Firebase for user authentication and data storage instead of mock data.

## Firebase Configuration
The Firebase configuration is already set up in `src/firebase/config.ts` with the following project:
- **Project ID**: fida-global
- **Domain**: fida-global.firebaseapp.com

## Security Rules
The application includes Firebase security rules in `firestore.rules` that allow:
- Full access to `users` collection (for user management)
- Full access to `visitors` collection (for visitor data)
- Full access to `audit_logs` collection (for audit trails)

## Deploying Security Rules
To deploy the security rules to Firebase:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init firestore
   ```

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## User Management
The system does not create any default users automatically. All users must be created through the signup page:

1. **First User**: Navigate to `/signup` to create the first admin account
2. **Additional Users**: Use the signup page or admin dashboard to create more users
3. **Role Assignment**: Choose appropriate roles (admin, hierarchy-person, front-desk) during signup

## Database Collections
The application uses these Firebase collections:

### Users Collection
- Stores user accounts with authentication details
- Includes role-based permissions
- Tracks last login times

### Visitors Collection
- Stores visitor check-in/check-out data
- Includes health screening information
- Tracks family members and badges

### Audit Logs Collection
- Records all system actions
- Tracks user activities and changes
- Maintains security audit trail

## Testing the System
1. **Start the application** - it will automatically create default users
2. **Use the demo accounts** listed above to test different roles
3. **Create new users** through the signup page
4. **Check Firebase Console** to see the data being stored

## Security Notes
⚠️ **Important**: The current security rules allow full access for development. In production:
- Implement proper authentication
- Use role-based access control
- Hash passwords properly
- Restrict access based on user roles

## Troubleshooting
If you encounter permission errors:
1. Check that Firebase rules are deployed
2. Verify the Firebase project ID matches
3. Ensure the collections exist in Firebase
4. Check browser console for detailed error messages 