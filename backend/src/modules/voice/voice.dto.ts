// ============================================================================
// Voice DTOs — Speech Synthesis & Transcriptions
// ============================================================================
export class SynthesizeSpeechDto {
  text: string;
  language?: string;
  voiceGender?: 'female' | 'male';
  rate?: number;
}

export class TranscribeAudioDto {
  audioBase64: string;
  language?: string;
}
