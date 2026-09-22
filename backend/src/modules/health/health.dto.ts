// ============================================================================
// Health DTOs — Medical reports, vitals, prescriptions
// ============================================================================
export class CreateMedicalReportDto {
  elderId: string;
  title: string;
  doctorName: string;
  reportDate: string;
  category: 'Prescription' | 'Lab Test' | 'Doctor Visit' | 'Scan' | 'Vitals' | 'Other';
  fileUrl?: string;
  summary?: string;
  notes?: string;
}

export class UpdateMedicalReportDto {
  title?: string;
  doctorName?: string;
  reportDate?: string;
  category?: 'Prescription' | 'Lab Test' | 'Doctor Visit' | 'Scan' | 'Vitals' | 'Other';
  fileUrl?: string;
  summary?: string;
  notes?: string;
}

export class CreateCareNoteDto {
  elderId: string;
  title: string;
  conditionDetails: string;
  careInstructions: string;
  aiGuidance?: string;
}
