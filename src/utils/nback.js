/**
 * N-back utility helpers for sequence generation and result scoring.
 */

/**
 * Builds a randomized sequence and target flags for the configured N-back mode.
 *
 * @param {{ nValue: number, numTrials: number, stimulusType: "letters" | "numbers" | "positions" }} options
 * @returns {{ sequence: Array<string|number>, targetFlags: boolean[] }}
 */
export function generateSequence({ nValue, numTrials, stimulusType }) {
  const sequence = [];
  const targetFlags = [];

  const pools = {
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    numbers: "0123456789".split(""),
    positions: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };

  const pool = pools[stimulusType];

  for (let i = 0; i < numTrials; i += 1) {
    let stimulus;
    let isTarget = false;

    // First n trials cannot be true targets because no n-back history exists yet.
    if (i >= nValue) {
      const shouldBeTarget = Math.random() < 0.3;
      if (shouldBeTarget) {
        stimulus = sequence[i - nValue];
        isTarget = true;
      } else {
        let candidate;
        do {
          candidate = pool[Math.floor(Math.random() * pool.length)];
        } while (candidate === sequence[i - nValue]);
        stimulus = candidate;
      }
    } else {
      stimulus = pool[Math.floor(Math.random() * pool.length)];
    }

    sequence.push(stimulus);
    targetFlags.push(isTarget);
  }

  return { sequence, targetFlags };
}

/**
 * Computes scoring metrics from trial responses.
 *
 * @param {Array<{trial:number,isTarget:boolean,userResponded:boolean,reactionTime:number|null}>} responses
 * @param {number} minTrialIndex Start scoring from this trial index.
 * @returns {{
 *  accuracy:number,
 *  hits:number,
 *  misses:number,
 *  falseAlarms:number,
 *  correctRejections:number,
 *  avgReactionTime:number,
 *  avgCorrectHitOrRejectionReactionTime:number
 * }}
 */
export function calculateResults(responses, minTrialIndex = 0) {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;

  let totalReactionTimeAll = 0;
  let reactionTimeCountAll = 0;

  let totalReactionTimeCorrect = 0;
  let reactionTimeCountCorrect = 0;

  for (const response of responses) {
    // Ignore warm-up/early trials before the chosen scoring boundary.
    if (response.trial < minTrialIndex) {
      continue;
    }

    if (response.reactionTime !== null) {
      totalReactionTimeAll += response.reactionTime;
      reactionTimeCountAll += 1;
    }

    if (response.isTarget && response.userResponded) {
      hits += 1;
      if (response.reactionTime !== null) {
        totalReactionTimeCorrect += response.reactionTime;
        reactionTimeCountCorrect += 1;
      }
    } else if (response.isTarget && !response.userResponded) {
      misses += 1;
    } else if (!response.isTarget && response.userResponded) {
      falseAlarms += 1;
    } else {
      correctRejections += 1;
      if (response.reactionTime !== null) {
        totalReactionTimeCorrect += response.reactionTime;
        reactionTimeCountCorrect += 1;
      }
    }
  }

  const total = hits + misses + falseAlarms + correctRejections;
  const accuracy = total > 0 ? Math.round(((hits + correctRejections) / total) * 100) : 0;

  return {
    accuracy,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    avgReactionTime: reactionTimeCountAll > 0 ? Math.round(totalReactionTimeAll / reactionTimeCountAll) : 0,
    avgCorrectHitOrRejectionReactionTime:
      reactionTimeCountCorrect > 0 ? Math.round(totalReactionTimeCorrect / reactionTimeCountCorrect) : 0,
  };
}
