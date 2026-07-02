/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5
 *   5 = perfect response (sure + correct)
 *   4 = correct with some hesitation (correct + unsure)
 *   3 = correct with serious difficulty (correct + guess)
 *   2 = incorrect; where the correct one seemed easy to recall (wrong + sure)
 *   1 = incorrect response; the correct one remembered (wrong + unsure)
 *   0 = complete blackout (wrong + guess)
 */

export interface ReviewResult {
  nextInterval: number;
  nextEaseFactor: number;
  nextRepetitions: number;
}

export function calculateNextReview(
  repetitions: number,
  easeFactor: number,
  interval: number,
  quality: number
): ReviewResult {
  let nextInterval: number;
  let nextEaseFactor: number;
  let nextRepetitions: number;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * easeFactor);
    }
    nextRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset
    nextRepetitions = 0;
    nextInterval = 1;
  }

  // Update ease factor
  nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't go below 1.3
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  return {
    nextInterval,
    nextEaseFactor,
    nextRepetitions,
  };
}

export function mapConfidenceToQuality(isCorrect: boolean, confidence: string): number {
  if (isCorrect) {
    if (confidence === "sure") return 5;
    if (confidence === "unsure") return 4;
    return 3; // guess
  } else {
    if (confidence === "sure") return 2;
    if (confidence === "unsure") return 1;
    return 0; // guess
  }
}
