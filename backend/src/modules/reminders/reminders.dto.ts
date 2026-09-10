// ============================================================================
// Reminders DTOs
// ============================================================================
export class CreateReminderDto {
  type: string;        // "medication" | "hydration" | "activity"
  title: string;
  description?: string;
  scheduleCron: string; // cron expression e.g. "0 8 * * *" for 8am daily
}

export class UpdateReminderDto {
  title?: string;
  description?: string;
  scheduleCron?: string;
  isActive?: boolean;
}

export class ConfirmReminderDto {
  reminderId: string;
}
