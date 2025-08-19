import { Visitor, HealthScreening } from '../types';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  visitorId: string;
  type: 'appointment-scheduled' | 'check-in-completed' | 'health-alert';
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

class EmailService {
  private emailTemplates = {
    appointmentScheduled: (visitor: Visitor): EmailTemplate => ({
      subject: `Appointment Scheduled - ${visitor.firstName} ${visitor.lastName}`,
      body: `
        <h2>Appointment Scheduled</h2>
        <p><strong>Visitor:</strong> ${visitor.firstName} ${visitor.lastName}</p>
        <p><strong>Meeting with:</strong> ${visitor.visitorMeetingSelection}</p>
        <p><strong>Purpose:</strong> ${visitor.visitPurpose}${visitor.visitPurposeOther ? ` - ${visitor.visitPurposeOther}` : ''}</p>
        <p><strong>Scheduled for:</strong> ${visitor.appointmentTime ? new Date(visitor.appointmentTime).toLocaleString() : 'Not specified'}</p>
        <p><strong>Contact:</strong> ${visitor.phone}${visitor.email ? ` | ${visitor.email}` : ''}</p>
        ${visitor.visitorMeetingSelection === 'resident' ? `
        <p><strong>Resident:</strong> ${visitor.residentName}</p>
        <p><strong>Room:</strong> ${visitor.residentRoom}</p>
        <p><strong>Category:</strong> ${visitor.visitorCategory}${visitor.visitorCategoryOther ? ` - ${visitor.visitorCategoryOther}` : ''}</p>
        ` : ''}
        ${visitor.visitorMeetingSelection === 'staff' ? `
        <p><strong>Department:</strong> ${visitor.staffDepartment}</p>
        ` : ''}
        <hr>
        <p><em>This is an automated notification from the visitor management system.</em></p>
      `
    }),

    checkInCompleted: (visitor: Visitor, healthScreening: HealthScreening): EmailTemplate => ({
      subject: `Check-in Completed - ${visitor.firstName} ${visitor.lastName}`,
      body: `
        <h2>Visitor Check-in Completed</h2>
        <p><strong>Visitor:</strong> ${visitor.firstName} ${visitor.lastName}</p>
        <p><strong>Badge Number:</strong> ${visitor.badgeNumber}</p>
        <p><strong>Visitor ID:</strong> ${visitor.visitorIdNumber}</p>
        <p><strong>Check-in Time:</strong> ${visitor.checkInTime.toLocaleString()}</p>
        <p><strong>Meeting with:</strong> ${visitor.visitorMeetingSelection}</p>
        <p><strong>Purpose:</strong> ${visitor.visitPurpose}${visitor.visitPurposeOther ? ` - ${visitor.visitPurposeOther}` : ''}</p>
        <p><strong>Appointment Type:</strong> ${visitor.appointmentType}</p>
        
        ${visitor.visitorMeetingSelection === 'resident' ? `
        <p><strong>Resident:</strong> ${visitor.residentName}</p>
        <p><strong>Room:</strong> ${visitor.residentRoom}</p>
        <p><strong>Category:</strong> ${visitor.visitorCategory}${visitor.visitorCategoryOther ? ` - ${visitor.visitorCategoryOther}` : ''}</p>
        ` : ''}
        ${visitor.visitorMeetingSelection === 'staff' ? `
        <p><strong>Department:</strong> ${visitor.staffDepartment}</p>
        ` : ''}
        
        <h3>Health Screening Summary</h3>
        <ul>
          <li>No fever/COVID symptoms (48hrs): ${healthScreening.noFeverOrCovidSymptoms ? '✅' : '❌'}</li>
          <li>Not in contact with ill persons: ${healthScreening.notInContactWithIll ? '✅' : '❌'}</li>
          <li>Temperature: ${healthScreening.temperature ? `${healthScreening.temperature}°F` : 'Not recorded'}</li>
          <li>Vaccination up-to-date: ${healthScreening.vaccinationStatusUpToDate ? '✅' : 'Not specified'}</li>
          <li>Agreement acknowledged: ${healthScreening.visitorAgreementAcknowledgement ? '✅' : '❌'}</li>
        </ul>
        
        ${healthScreening.emergencyContactName && healthScreening.emergencyContactNumber ? `
        <p><strong>Emergency Contact:</strong> ${healthScreening.emergencyContactName} - ${healthScreening.emergencyContactNumber}</p>
        ` : ''}
        
        <hr>
        <p><em>This is an automated notification from the visitor management system.</em></p>
      `
    }),

    healthAlert: (visitor: Visitor, healthScreening: HealthScreening): EmailTemplate => ({
      subject: `HEALTH ALERT - ${visitor.firstName} ${visitor.lastName} Check-in`,
      body: `
        <h2 style="color: red;">HEALTH ALERT - Visitor Check-in</h2>
        <p><strong>Visitor:</strong> ${visitor.firstName} ${visitor.lastName}</p>
        <p><strong>Badge Number:</strong> ${visitor.badgeNumber}</p>
        <p><strong>Check-in Time:</strong> ${visitor.checkInTime.toLocaleString()}</p>
        <p><strong>Meeting with:</strong> ${visitor.visitorMeetingSelection}</p>
        
        <h3 style="color: red;">Health Concerns Identified:</h3>
        <ul>
          ${healthScreening.hasSymptoms ? '<li>❌ Visitor reported symptoms</li>' : ''}
          ${healthScreening.temperature && healthScreening.temperature > 100.4 ? `<li>❌ Elevated temperature: ${healthScreening.temperature}°F</li>` : ''}
          ${healthScreening.testResult === 'positive' ? '<li>❌ Positive COVID test result</li>' : ''}
          ${!healthScreening.noFeverOrCovidSymptoms ? '<li>❌ Fever or COVID symptoms in last 48 hours</li>' : ''}
          ${!healthScreening.notInContactWithIll ? '<li>❌ Contact with ill persons reported</li>' : ''}
        </ul>
        
        <h3>Required Actions:</h3>
        <ul>
          <li>Enhanced monitoring required</li>
          <li>Social distancing protocols</li>
          <li>Face mask mandatory</li>
          <li>Frequent hand sanitization</li>
          ${healthScreening.temperature && healthScreening.temperature > 100.4 ? '<li>Temperature monitoring every 2 hours</li>' : ''}
          ${healthScreening.testResult === 'positive' ? '<li>Special isolation protocols apply</li>' : ''}
        </ul>
        
        <p><strong>Emergency Contact:</strong> ${visitor.emergencyContact} - ${visitor.emergencyPhone}</p>
        
        <hr>
        <p><em>This is an automated health alert from the visitor management system.</em></p>
      `
    })
  };

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service
      // like SendGrid, AWS SES, or a local SMTP server
      console.log('Sending email notification:', {
        to: notification.to,
        subject: notification.subject,
        type: notification.type,
        visitorId: notification.visitorId
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email content for debugging
      console.log('Email content:', notification.body);
      
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  async sendAppointmentScheduledNotification(visitor: Visitor, recipientEmail: string): Promise<boolean> {
    const template = this.emailTemplates.appointmentScheduled(visitor);
    const notification: EmailNotification = {
      to: recipientEmail,
      subject: template.subject,
      body: template.body,
      visitorId: visitor.id,
      type: 'appointment-scheduled'
    };

    return this.sendEmail(notification);
  }

  async sendCheckInNotification(visitor: Visitor, healthScreening: HealthScreening, recipientEmail: string): Promise<boolean> {
    const template = this.emailTemplates.checkInCompleted(visitor, healthScreening);
    const notification: EmailNotification = {
      to: recipientEmail,
      subject: template.subject,
      body: template.body,
      visitorId: visitor.id,
      type: 'check-in-completed'
    };

    return this.sendEmail(notification);
  }

  async sendHealthAlertNotification(visitor: Visitor, healthScreening: HealthScreening, recipientEmail: string): Promise<boolean> {
    const template = this.emailTemplates.healthAlert(visitor, healthScreening);
    const notification: EmailNotification = {
      to: recipientEmail,
      subject: template.subject,
      body: template.body,
      visitorId: visitor.id,
      type: 'health-alert'
    };

    return this.sendEmail(notification);
  }

  // Method to determine recipient email based on visitor meeting selection
  getRecipientEmail(visitor: Visitor): string {
    // In a real implementation, this would look up the appropriate recipient
    // based on the visitor meeting selection and other criteria
    
    switch (visitor.visitorMeetingSelection) {
      case 'resident':
        // Send to resident's assigned staff or family contact
        return 'resident-staff@facility.com';
      case 'staff':
        // Send to department head or supervisor
        return `${visitor.staffDepartment?.toLowerCase()}-supervisor@facility.com`;
      case 'sisters':
        // Send to sisters' coordinator
        return 'sisters-coordinator@facility.com';
      default:
        return 'admin@facility.com';
    }
  }

  // Method to check if health alert notification should be sent
  shouldSendHealthAlert(healthScreening: HealthScreening): boolean {
    return healthScreening.hasSymptoms || 
      (healthScreening.temperature && healthScreening.temperature > 100.4) ||
      healthScreening.testResult === 'positive' ||
      !healthScreening.noFeverOrCovidSymptoms ||
      !healthScreening.notInContactWithIll;
  }
}

export const emailService = new EmailService(); 