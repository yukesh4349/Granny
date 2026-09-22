// ============================================================================
// Voice Controller — REST endpoints for voice features
// ============================================================================
import { Controller, Post, Body } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { SynthesizeSpeechDto, TranscribeAudioDto } from './voice.dto';

@Controller('voice')
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  @Post('synthesize')
  async synthesize(@Body() dto: SynthesizeSpeechDto) {
    return this.voiceService.synthesize(dto);
  }

  @Post('transcribe')
  async transcribe(@Body() dto: TranscribeAudioDto) {
    return this.voiceService.transcribe(dto);
  }
}
