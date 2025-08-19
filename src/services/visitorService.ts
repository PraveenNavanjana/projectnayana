import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Visitor, HealthScreening, AuditLog } from '../types';

export class VisitorService {
  private visitorsCollection = collection(db, 'visitors');
  private auditCollection = collection(db, 'audit_logs');

  async checkInVisitor(visitorData: Omit<Visitor, 'id' | 'checkInTime' | 'qrCode' | 'badgeNumber' | 'visitorIdNumber'> & { visitorIdNumber?: string }, isReturningVisitor: boolean = false): Promise<Visitor> {
    try {
      console.log('Starting check-in process for visitor:', visitorData.firstName, visitorData.lastName);
      console.log('Visitor data received:', visitorData);
      
      let visitorIdNumber: string;
      let qrCode: string;
      let badgeNumber: string;

      if (isReturningVisitor) {
        // For returning visitors, use existing ID and generate new QR code
        if (!visitorData.visitorIdNumber) {
          throw new Error('visitorIdNumber is required for returning visitors.');
        }
        visitorIdNumber = visitorData.visitorIdNumber;
        qrCode = this.generateQRCode(visitorIdNumber);
        badgeNumber = this.generateBadgeNumber();
        console.log('Returning visitor - using existing ID:', visitorIdNumber);
      } else {
        // For new visitors, generate new ID and QR code
        visitorIdNumber = this.generateVisitorIdNumber();
        qrCode = this.generateQRCode(visitorIdNumber);
        badgeNumber = this.generateBadgeNumber();
        console.log('New visitor - generated ID:', visitorIdNumber);
      }
      
      const visitor: Omit<Visitor, 'id'> = {
        ...visitorData,
        visitorIdNumber,
        checkInTime: new Date(),
        qrCode,
        badgeNumber,
        status: 'checked-in'
      };

      console.log('Prepared visitor data for Firebase:', visitor);
      console.log('Attempting to save to Firebase collection:', this.visitorsCollection);

      const docRef = await addDoc(this.visitorsCollection, {
        ...visitor,
        checkInTime: Timestamp.fromDate(visitor.checkInTime),
        healthScreening: {
          ...visitor.healthScreening,
          screeningDate: Timestamp.fromDate(visitor.healthScreening.screeningDate)
        }
      });

      console.log('Successfully saved visitor to Firebase with ID:', docRef.id);

      try {
        await this.logAudit('visitor_check_in', 'system', docRef.id, {
          visitorName: `${visitor.firstName} ${visitor.lastName}`,
          resident: visitor.residentName,
          room: visitor.residentRoom
        });
        console.log('Audit log created successfully');
      } catch (auditError) {
        console.warn('Failed to log audit, but visitor was created:', auditError);
      }

      // Return the complete visitor object
      const result = {
        id: docRef.id,
        ...visitor
      };
      
      console.log('Returning visitor object:', result);
      return result;
    } catch (error) {
      console.error('Error checking in visitor:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  async checkOutVisitor(visitorId: string, isFamilyMember: boolean = false, mainVisitorId?: string): Promise<void> {
    try {
      if (isFamilyMember && mainVisitorId) {
        // Check out a family member
        const visitorRef = doc(db, 'visitors', mainVisitorId);
        const visitorDoc = await getDoc(visitorRef);
        
        if (visitorDoc.exists()) {
          const visitorData = visitorDoc.data();
          const updatedFamilyMembers = visitorData.familyMembers?.map((member: any) => 
            member.visitorId === visitorId 
              ? { ...member, checkOutTime: Timestamp.fromDate(new Date()) }
              : member
          ) || [];
          
          await updateDoc(visitorRef, {
            familyMembers: updatedFamilyMembers
          });
        }
      } else {
        // Check out main visitor
        const visitorRef = doc(db, 'visitors', visitorId);
        await updateDoc(visitorRef, {
          checkOutTime: Timestamp.fromDate(new Date()),
          status: 'checked-out'
        });
      }

      await this.logAudit('visitor_check_out', 'system', visitorId, {
        timestamp: new Date().toISOString(),
        isFamilyMember
      });
    } catch (error) {
      console.error('Error checking out visitor:', error);
      throw error;
    }
  }

  async getActiveVisitors(): Promise<Visitor[]> {
    try {
      // First try with the composite query
      const q = query(
        this.visitorsCollection,
        where('status', '==', 'checked-in'),
        orderBy('checkInTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
        healthScreening: {
          ...doc.data().healthScreening,
          screeningDate: doc.data().healthScreening.screeningDate.toDate()
        }
      })) as Visitor[];
    } catch (error: any) {
      // If the index doesn't exist, fall back to a simpler query
      if (error.code === 'failed-precondition') {
        console.warn('Composite index not found, using fallback query');
        const fallbackQuery = query(
          this.visitorsCollection,
          where('status', '==', 'checked-in')
        );
        
        const querySnapshot = await getDocs(fallbackQuery);
        const visitors = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkInTime: doc.data().checkInTime.toDate(),
          checkOutTime: doc.data().checkOutTime?.toDate(),
          healthScreening: {
            ...doc.data().healthScreening,
            screeningDate: doc.data().healthScreening.screeningDate.toDate()
          }
        })) as Visitor[];
        
        // Sort manually in JavaScript
        return visitors.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
      }
      
      console.error('Error fetching active visitors:', error);
      // Return empty array instead of throwing for permission issues
      return [];
    }
  }

  async getTodayVisitors(): Promise<Visitor[]> {
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all visitors who checked in today (regardless of status)
      const q = query(
        this.visitorsCollection,
        where('checkInTime', '>=', Timestamp.fromDate(today)),
        orderBy('checkInTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
        healthScreening: {
          ...doc.data().healthScreening,
          screeningDate: doc.data().healthScreening.screeningDate.toDate()
        }
      })) as Visitor[];
    } catch (error: any) {
      // If the index doesn't exist, fall back to a simpler query
      if (error.code === 'failed-precondition') {
        console.warn('Composite index not found for today visitors, using fallback query');
        // Fix: Ensure we pass a Date object, not a number, to Timestamp.fromDate
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        const fallbackQuery = query(
          this.visitorsCollection,
          where('checkInTime', '>=', Timestamp.fromDate(midnight))
        );
        
        const querySnapshot = await getDocs(fallbackQuery);
        const visitors = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkInTime: doc.data().checkInTime.toDate(),
          checkOutTime: doc.data().checkOutTime?.toDate(),
          healthScreening: {
            ...doc.data().healthScreening,
            screeningDate: doc.data().healthScreening.screeningDate.toDate()
          }
        })) as Visitor[];
        
        // Sort manually in JavaScript
        return visitors.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
      }
      
      console.error('Error fetching today\'s visitors:', error);
      // Return empty array instead of throwing for permission issues
      return [];
    }
  }

  subscribeToActiveVisitors(callback: (visitors: Visitor[]) => void) {
    try {
      console.log('Setting up visitor subscription...');
      // Use a simpler query that doesn't require a composite index
      const q = query(
        this.visitorsCollection,
        where('status', '==', 'checked-in')
      );

      console.log('Query created:', q);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
          console.log('Received snapshot with', querySnapshot.docs.length, 'documents');
          const visitors = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            checkInTime: doc.data().checkInTime.toDate(),
            checkOutTime: doc.data().checkOutTime?.toDate(),
            healthScreening: {
              ...doc.data().healthScreening,
              screeningDate: doc.data().healthScreening.screeningDate.toDate()
            }
          })) as Visitor[];
          
          // Sort manually in JavaScript
          const sortedVisitors = visitors.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
          console.log('Processed visitors:', sortedVisitors.length);
          callback(sortedVisitors);
        } catch (error) {
          console.error('Error processing visitor data:', error);
          callback([]);
        }
      }, (error) => {
        console.error('Error in visitor subscription:', error);
        // Return empty array on error and don't throw
        callback([]);
      });

      console.log('Subscription set up successfully');
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up visitor subscription:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  async findVisitorByIdNumber(visitorIdNumber: string): Promise<Visitor | null> {
    try {
      console.log('Searching for visitor with ID:', visitorIdNumber);
      
      const q = query(
        this.visitorsCollection,
        where('visitorIdNumber', '==', visitorIdNumber)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Query result:', querySnapshot.size, 'documents found');
      
      if (querySnapshot.empty) {
        console.log('No visitor found with ID:', visitorIdNumber);
        return null;
      }

      const doc = querySnapshot.docs[0];
      const visitorData = {
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
        healthScreening: {
          ...doc.data().healthScreening,
          screeningDate: doc.data().healthScreening.screeningDate.toDate()
        }
      } as Visitor;
      
      console.log('Found visitor:', visitorData.firstName, visitorData.lastName);
      return visitorData;
    } catch (error) {
      console.error('Error finding visitor by ID number:', error);
      // Return null instead of throwing for permission issues
      return null;
    }
  }

  async findVisitorByQRCode(qrCodeData: string): Promise<Visitor | null> {
    try {
      // Parse the QR code data to extract visitor ID
      const qrData = JSON.parse(qrCodeData);
      
      // Handle both old and new QR code formats
      let visitorId = null;
      
      if (qrData.t === 'v' && qrData.id) {
        // New compact format
        visitorId = qrData.id;
      } else if (qrData.type === 'visitor_login' && qrData.visitorId) {
        // Old format
        visitorId = qrData.visitorId;
      } else if (qrData.visitorId) {
        // Fallback for other formats
        visitorId = qrData.visitorId;
      }
      
      if (visitorId) {
        return await this.findVisitorByIdNumber(visitorId);
      }
      return null;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  async emergencyEvacuation(visitorIds: string[]): Promise<void> {
    try {
      const updatePromises = visitorIds.map(id => 
        updateDoc(doc(db, 'visitors', id), {
          status: 'emergency-evacuated',
          checkOutTime: Timestamp.fromDate(new Date())
        })
      );

      await Promise.all(updatePromises);

      try {
        await this.logAudit('emergency_evacuation', 'system', '', {
          evacuatedVisitors: visitorIds,
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        console.warn('Failed to log emergency evacuation audit:', auditError);
      }
    } catch (error) {
      console.error('Error during emergency evacuation:', error);
      // Don't throw, just log the error
    }
  }

  private generateVisitorIdNumber(): string {
    return `VID-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateQRCode(visitorIdNumber: string): string {
    // Create a simpler QR code data that contains login information
    // Using a more compact format to avoid QR code size issues
    const loginData = {
      t: 'v', // type: visitor
      id: visitorIdNumber,
      ts: Date.now(), // timestamp as number
      f: 'VMS' // facility
    };
    return JSON.stringify(loginData);
  }

  private generateBadgeNumber(): string {
    return `B${Date.now().toString().slice(-6)}`;
  }

  private async logAudit(action: string, userId: string, visitorId: string, details: Record<string, any>): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date(),
        action,
        userId,
        visitorId,
        details,
        ipAddress: 'system' // In production, get actual IP
      };

      await addDoc(this.auditCollection, {
        ...auditLog,
        timestamp: Timestamp.fromDate(auditLog.timestamp)
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  // Test method to verify database connection
  async testDatabaseConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('Testing database connection...');
      
      // Try to add a test document
      const testDoc = {
        test: true,
        timestamp: Timestamp.fromDate(new Date()),
        message: 'Database connection test'
      };
      
      const docRef = await addDoc(this.visitorsCollection, testDoc);
      console.log('Test document added successfully:', docRef.id);
      
      // Try to read it back
      const testQuery = query(this.visitorsCollection, where('test', '==', true));
      const querySnapshot = await getDocs(testQuery);
      
      console.log('Test query successful, found documents:', querySnapshot.size);
      
      // Clean up test document
      await updateDoc(doc(db, 'visitors', docRef.id), { test: false });
      
      return {
        success: true,
        message: `Database connection successful. Test document created and queried. Found ${querySnapshot.size} test documents.`
      };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return {
        success: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const visitorService = new VisitorService();