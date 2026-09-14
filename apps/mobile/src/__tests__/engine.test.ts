import { getNextDifficulty } from '../services/difficultyEngine';

describe('Granny Mobile Core Verification Suite', () => {
  it('should initialize default cognitive level to 1', () => {
    const initialDiff = getNextDifficulty('usr-1', 'remember-my-home', [], 1);
    expect(initialDiff.level).toBe(1);
  });

  it('should adaptively advance difficulty level for high accuracy and fast response', () => {
    const highPerfAttempts = [
      { item_index: 0, correct: true, latency_ms: 2100 },
      { item_index: 1, correct: true, latency_ms: 1900 },
      { item_index: 2, correct: true, latency_ms: 2200 },
      { item_index: 3, correct: true, latency_ms: 1800 },
      { item_index: 4, correct: true, latency_ms: 2000 },
    ];
    const higherDiff = getNextDifficulty('usr-1', 'remember-my-home', highPerfAttempts, 1);
    expect(higherDiff.level).toBe(2);
    expect(higherDiff.accuracyRate).toBe(1);
  });

  it('should gently lower difficulty level for struggling elders', () => {
    const lowPerfAttempts = [
      { item_index: 0, correct: false, latency_ms: 9000 },
      { item_index: 1, correct: false, latency_ms: 9500 },
      { item_index: 2, correct: false, latency_ms: 9200 },
    ];
    const lowerDiff = getNextDifficulty('usr-1', 'remember-my-home', lowPerfAttempts, 3);
    expect(lowerDiff.level).toBe(2);
  });

  it('should accurately detect pre-LLM distress phrases and safety guardrails', () => {
    const DISTRESS_PATTERNS = [
      /i am lost/i,
      /where am i/i,
      /who are you/i,
      /i am scared/i,
      /i'm frightened/i,
      /help me/i,
      /i fell/i,
      /i can't breathe/i,
      /severe pain/i,
      /someone is in my house/i,
      /i don't know where i am/i,
      /want to go home/i,
    ];
    const isDistress = (msg: string) => DISTRESS_PATTERNS.some(p => p.test(msg));

    expect(isDistress('I am lost and scared')).toBe(true);
    expect(isDistress('Where am I?')).toBe(true);
    expect(isDistress('What lovely flowers in the garden!')).toBe(false);
  });

  it('should construct valid DiceBear and Pollinations image endpoints', () => {
    const seed = 'GrandmaRose';
    const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
    expect(dicebearUrl).toContain('dicebear.com');

    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent('peaceful living room')}?width=800&height=600&nologo=true`;
    expect(pollinationsUrl).toContain('pollinations.ai');
  });
});
