// ============================================================================
// Notifications DTOs — Caretaker alarms, SOS, distress alerts
// ============================================================================
export class CreateNotificationDto {
  elderId: string;
  elderName: string;
  type: 'HEALTH_ALERT' | 'MISSED_MEDICATION' | 'MEMORY_SHARED' | 'DISTRESS' | 'GENERAL';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  transcriptExcerpt?: string;
  recommendation?: string;
  emailSent?: boolean;
  recipientEmail?: string;
}

export class MarkReadDto {
  isRead: boolean;
}
