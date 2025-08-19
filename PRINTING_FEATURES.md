# Printing Features

This document describes the comprehensive printing functionality implemented in the Visitor Management System.

## Overview

The system now includes a robust printing service that can print various types of documents to connected printers. When users confirm actions (like check-ins), they can print badges, name tags, visitor cards, and reports directly to their connected printer.

## Features

### 1. Print Service (`src/services/printService.ts`)

The core printing service provides:
- **Badge Printing**: Professional visitor badges with all visitor information
- **Name Tag Printing**: Clean name tags for visitors and family members
- **Visitor Card Printing**: Comprehensive visitor cards with QR code placeholders
- **Report Printing**: Detailed reports for admin and front desk staff

### 2. Print Types

#### Visitor Badge
- Professional layout with visitor information
- Access level indicator
- Badge number and visitor ID
- Meeting details and purpose
- Print-ready formatting

#### Name Tag
- Clean, readable design
- Visitor name prominently displayed
- Meeting information
- Badge number
- Date of visit

#### Visitor Card
- Comprehensive visitor information
- Resident details
- Access level and purpose
- QR code placeholder
- Professional card format

#### Reports
- Summary statistics
- Detailed visitor lists
- User management reports
- Front desk status reports
- Professional formatting for business use

### 3. Integration Points

#### Check-In Complete Screen
- **Print Badge**: Print visitor badge to connected printer
- **Print Name Tag**: Print name tag for the visitor
- **Print Card**: Print comprehensive visitor card
- **Print All Family Tags**: Print name tags for all family members

#### Reports Screen
- **Print Report**: Print comprehensive visitor reports
- **Download CSV**: Still available for digital use

#### Admin Dashboard
- **Print User List**: Print complete user management report
- **Create User**: Standard user creation functionality

#### Front Desk Dashboard
- **Print Status**: Print current front desk status report
- **New Check-in**: Standard check-in functionality

## How It Works

### 1. Print Process
1. User clicks a print button
2. System generates formatted HTML content
3. Opens new window with print-ready content
4. Automatically triggers print dialog
5. User selects printer and settings
6. Document prints to selected printer

### 2. Printer Selection
- Uses system default printer
- Supports all connected printers
- Works with network printers
- Compatible with iPad and main device printers

### 3. Fallback Handling
- If popup is blocked, falls back to current page printing
- Graceful error handling with user feedback
- Automatic cleanup of print windows

## Technical Implementation

### Print Service Class
```typescript
class PrintService {
  async printBadge(printData: PrintData): Promise<boolean>
  async printNameTag(printData: PrintData): Promise<boolean>
  async printVisitorCard(printData: PrintData): Promise<boolean>
  async printReport(printData: PrintData): Promise<boolean>
}
```

### Print Data Interface
```typescript
interface PrintData {
  type: 'badge' | 'nameTag' | 'visitorCard' | 'report';
  content: {
    visitorName?: string;
    residentName?: string;
    badgeNumber?: string;
    visitorId?: string;
    date?: string;
    purpose?: string;
    meetingWith?: string;
    accessLevel?: string;
    [key: string]: any;
  };
  printerSettings?: {
    printerName?: string;
    paperSize?: string;
    orientation?: 'portrait' | 'landscape';
    copies?: number;
  };
}
```

## Usage Examples

### Printing a Visitor Badge
```typescript
const printData: PrintData = {
  type: 'badge',
  content: {
    visitorName: 'John Doe',
    residentName: 'Jane Smith',
    badgeNumber: 'V001',
    visitorId: 'VIS123',
    date: '2024-01-15',
    purpose: 'Family Visit',
    meetingWith: 'Resident',
    accessLevel: 'VISITOR'
  }
};

const success = await printService.printBadge(printData);
```

### Printing a Report
```typescript
const printData: PrintData = {
  type: 'report',
  content: {
    title: 'Visitor Report - January 15, 2024',
    date: '2024-01-15 14:30:00',
    html: '<div>Custom report content...</div>'
  }
};

const success = await printService.printReport(printData);
```

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (including iPad)
- **Edge**: Full support
- **Mobile Browsers**: Limited support (may use fallback printing)

## Printer Requirements

- Any printer connected to the device
- Network printers accessible from the device
- USB printers connected to the device
- Wireless printers on the same network
- Cloud printing services (if configured)

## Security Features

- No sensitive data stored in print windows
- Automatic cleanup of print windows
- User confirmation before printing
- Error handling for failed print attempts

## Future Enhancements

- Printer selection dialog
- Custom print templates
- Batch printing capabilities
- Print queue management
- Print history tracking
- Custom paper sizes and orientations

## Troubleshooting

### Common Issues

1. **Print dialog doesn't appear**
   - Check if popups are blocked
   - Allow popups for the site
   - Try refreshing the page

2. **Print quality issues**
   - Check printer settings
   - Verify paper size selection
   - Check printer driver settings

3. **Printer not found**
   - Verify printer is connected
   - Check network connection
   - Restart printer service

### Support

For technical support with printing features, contact the system administrator or refer to the printer manufacturer's documentation.

