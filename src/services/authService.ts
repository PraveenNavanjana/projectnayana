import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  getDoc,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserRole, LoginCredentials, AuthState } from '../types';

class AuthService {
  private usersCollection = collection(db, 'users');

  // Initialize default users if they don't exist
  async initializeDefaultUsers(): Promise<void> {
    try {
      const querySnapshot = await getDocs(this.usersCollection);
      if (querySnapshot.empty) {
        console.log('No users found in database. Please create users through the signup page.');
      }
    } catch (error) {
      console.error('Error checking users collection:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('Attempting login for username:', credentials.username);
      
      // Query Firebase for the user
      const q = query(
        this.usersCollection,
        where('username', '==', credentials.username)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid username or password');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check password (in production, use proper password hashing)
      if (userData.password !== credentials.password) {
        throw new Error('Invalid username or password');
      }

      if (!userData.isActive) {
        throw new Error('Account is deactivated');
      }

      // Create user object
      const user: User = {
        id: userDoc.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        createdAt: userData.createdAt.toDate(),
        permissions: userData.permissions || [],
        lastLogin: userData.lastLogin?.toDate()
      };

      // Update last login time
      await this.updateLastLogin(userDoc.id);

      // Store user in localStorage for session management
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      console.log('Login successful for user:', user.username);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('currentUser');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> {
    try {
      console.log('Creating new user:', userData.username);
      
      // Check if username already exists
      const existingUserQuery = query(
        this.usersCollection,
        where('username', '==', userData.username)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        throw new Error('Username already exists');
      }

      // Check if email already exists
      const existingEmailQuery = query(
        this.usersCollection,
        where('email', '==', userData.email)
      );
      const existingEmailSnapshot = await getDocs(existingEmailQuery);
      
      if (!existingEmailSnapshot.empty) {
        throw new Error('Email already exists');
      }

      const newUser = {
        ...userData,
        createdAt: new Date(),
        isActive: true,
        lastLogin: null
      };

      // Save to Firebase
      const docRef = await addDoc(this.usersCollection, {
        ...newUser,
        createdAt: Timestamp.fromDate(newUser.createdAt),
        lastLogin: null
      });

      const createdUser: User = {
        ...newUser,
        id: docRef.id,
        createdAt: newUser.createdAt,
        lastLogin: undefined
      };

      console.log('User created successfully:', createdUser.username);
      return createdUser;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Fetching all users from Firebase...');
      const querySnapshot = await getDocs(this.usersCollection);
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastLogin: doc.data().lastLogin?.toDate()
      })) as User[];

      console.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('Updating user:', userId);
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Convert dates to Timestamps for Firebase
      const firebaseUpdates: any = { ...updates };
      if (updates.createdAt) {
        firebaseUpdates.createdAt = Timestamp.fromDate(updates.createdAt);
      }
      if (updates.lastLogin) {
        firebaseUpdates.lastLogin = Timestamp.fromDate(updates.lastLogin);
      }

      await updateDoc(userRef, firebaseUpdates);
      console.log('User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('Deleting user:', userId);
      
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastLogin: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      console.log('Changing password for user:', userId);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        password: newPassword // In production, hash this password
      });
      
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const q = query(
        this.usersCollection,
        where('username', '==', username)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt.toDate(),
        lastLogin: userData.lastLogin?.toDate()
      } as User;
    } catch (error) {
      console.error('Get user by username error:', error);
      return null;
    }
  }

  hasPermission(user: User, permission: string): boolean {
    if (user.role === 'super-admin') return true;
    return user.permissions.includes(permission);
  }

  canManageUsers(user: User): boolean {
    return this.hasPermission(user, 'manage_users') || user.role === 'super-admin';
  }

  canViewReports(user: User): boolean {
    return this.hasPermission(user, 'view_reports') || user.role === 'super-admin';
  }

  canCheckInVisitors(user: User): boolean {
    return this.hasPermission(user, 'check_in_visitors') || user.role === 'front-desk';
  }

  // Initialize the service when imported
  constructor() {
    // Initialize default users when the service is first created
    this.initializeDefaultUsers().catch(error => {
      console.error('Failed to initialize default users:', error);
    });
  }
}

export const authService = new AuthService(); 