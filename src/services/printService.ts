import { FamilyMember, NameTagData, Visitor } from '../types';
import { nameTagService } from './nameTagService';

export type PrintOrientation = 'portrait' | 'landscape';

export interface PrinterSettings {
  paperSize?: string;
  orientation?: PrintOrientation;
  copies?: number;
}

export interface PrintData {
  type: 'nameTag';
  content: {
    visitorName: string;
    residentName: string;
    date: string;
    badgeNumber: string;
    relationship?: string;
    visitorId?: string;
    meetingWith?: string;
    purpose?: string;
  };
  printerSettings?: PrinterSettings;
}

class PrintService {
  printVisitorCard(printData: PrintData) {
    throw new Error('Method not implemented.');
  }
  printNameTag(printData: PrintData) {
    throw new Error('Method not implemented.');
  }
  isPrintingSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.print === 'function';
  }

  async printThermalNameTag(printData: PrintData): Promise<boolean> {
    try {
      const { content } = printData;
      const nameTagData: NameTagData = {
        visitorName: content.visitorName,
        residentName: content.residentName,
        date: content.date,
      };

      nameTagService.printNameTag(nameTagData);
      return true;
    } catch (error) {
      console.error('printThermalNameTag error:', error);
      return false;
    }
  }

  async printAllFamilyThermalTags(
    mainVisitor: Visitor,
    familyMembers: FamilyMember[],
    printerSettings?: PrinterSettings
  ): Promise<boolean> {
    try {
      for (const member of familyMembers) {
        const memberNameTag: NameTagData = {
          visitorName: `${member.firstName} ${member.lastName}`.trim(),
          residentName: mainVisitor.residentName || 'N/A',
          date: new Date().toLocaleDateString(),
         
        };

        nameTagService.printNameTag(memberNameTag);
      }

      return true;
    } catch (error) {
      console.error('printAllFamilyThermalTags error:', error);
      return false;
    }
  }
}

export const printService = new PrintService();


