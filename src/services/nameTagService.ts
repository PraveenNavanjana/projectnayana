import { NameTagData } from '../types';

class NameTagService {
           generateNameTagHTML(nameTagData: NameTagData): string {
           const { visitorName, residentName } = nameTagData;

           return `
             <!DOCTYPE html>
             <html>
             <head>
               <meta charset="utf-8">
               <title>Visitor Name Tag</title>
               <style>
                 @media print {
                   body { margin: 0; }
                   .name-tag { page-break-inside: avoid; }
                 }

                 body {
                   font-family: Arial, sans-serif;
                   margin: 0;
                   padding: 0;
                   background: white;
                 }

                 .name-tag {
                   width: 2in;
                   height: 3in;
                   border: 1px solid #2563eb;
                   border-radius: 4px;
                   padding: 8px;
                   background: white;
                   position: relative;
                   overflow: hidden;
                   box-sizing: border-box;
                 }

                 .header {
                   text-align: center;
                   margin-bottom: 6px;
                 }

                 .facility-name {
                   font-size: 10px;
                   font-weight: bold;
                   color: #1e40af;
                   margin: 0;
                   text-transform: uppercase;
                   letter-spacing: 0.3px;
                 }

                 .visitor-section {
                   margin-bottom: 6px;
                 }

                 .visitor-name {
                   font-size: 14px;
                   font-weight: bold;
                   color: #1f2937;
                   margin: 0 0 3px 0;
                   text-align: center;
                   line-height: 1.2;
                 }

                 .resident-info {
                   font-size: 9px;
                   color: #6b7280;
                   text-align: center;
                   margin: 0;
                   line-height: 1.1;
                 }

                 .details-grid {
                   display: grid;
                   grid-template-columns: 1fr;
                   gap: 3px;
                   font-size: 8px;
                   margin-top: 6px;
                 }

                 .detail-item {
                   display: flex;
                   justify-content: space-between;
                   align-items: center;
                 }

                 .detail-label {
                   font-weight: bold;
                   color: #374151;
                   text-transform: uppercase;
                   font-size: 7px;
                   letter-spacing: 0.2px;
                 }

                 .detail-value {
                   color: #1f2937;
                   font-size: 8px;
                   text-align: right;
                   max-width: 60%;
                   word-wrap: break-word;
                 }

                 .badge-number {
                   position: absolute;
                   top: 4px;
                   right: 4px;
                   background: #2563eb;
                   color: white;
                   padding: 1px 4px;
                   border-radius: 2px;
                   font-size: 8px;
                   font-weight: bold;
                 }

                 .qr-placeholder {
                   position: absolute;
                   bottom: 4px;
                   right: 4px;
                   width: 24px;
                   height: 24px;
                   border: 1px dashed #d1d5db;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   font-size: 6px;
                   color: #9ca3af;
                   background: #f9fafb;
                 }

                 .date-time {
                   position: absolute;
                   bottom: 4px;
                   left: 4px;
                   font-size: 7px;
                   color: #6b7280;
                 }

                 .divider {
                   height: 1px;
                   background: #e5e7eb;
                   margin: 4px 0;
                 }
               </style>
             </head>
             <body>
               <div class="name-tag">
                 <div class="header">
                   <h1 class="facility-name">Visitor</h1>
                 </div>

                 <div class="visitor-section">
                   <h2 class="visitor-name">${visitorName}</h2>
                   <p class="resident-info">Visiting: ${residentName}</p>
                 </div>

                 <div class="divider"></div>

               </div>
             </div>
           </body>
           </html>
     `;
   }

   printNameTag(nameTagData: NameTagData): void {
     const html = this.generateNameTagHTML(nameTagData);

     // Create a new window for printing
     const printWindow = window.open('', '_blank');
     if (!printWindow) {
       alert('Please allow popups to print name tags');
       return;
     }

     printWindow.document.write(html);
     printWindow.document.close();

     // Wait for content to load, then print
     printWindow.onload = () => {
       printWindow.print();
       printWindow.close();
     };
   }

   downloadNameTag(nameTagData: NameTagData): void {
     const html = this.generateNameTagHTML(nameTagData);
     const blob = new Blob([html], { type: 'text/html' });
     const url = URL.createObjectURL(blob);

     const link = document.createElement('a');
     link.href = url;
     link.download = `name-tag-${nameTagData.visitorName.replace(/\s+/g, '-')}.html`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);

     URL.revokeObjectURL(url);
   }

   // Method to create name tag data from visitor information
   createNameTagData(visitor: any): NameTagData {
     return {
       visitorName: `${visitor.firstName} ${visitor.lastName}`,
       residentName: visitor.residentName || 'N/A',
       date: new Date().toLocaleDateString(),
     };
   }
 }

export const nameTagService = new NameTagService();