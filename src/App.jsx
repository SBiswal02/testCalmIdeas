import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountdownScreen from "./components/CountdownScreen";
import IntroScreen from "./components/IntroScreen";
import ResultsScreen from "./components/ResultsScreen";
import SettingsScreen from "./components/SettingsScreen";
import TestScreen from "./components/TestScreen";
import RulesScreen from "./components/RulesScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import { calculateResults, generateSequence } from "./utils/nback";

const PHASES = {
  INTRO: "intro",
  WELCOME: "welcome",
  RULES: "rules",
  PRACTICE_INFO: "practiceInfo",
  PRACTICE: "practice",
  SETTINGS: "settings",
  COUNTDOWN: "countdown",
  TEST: "test",
  RESULTS: "results",
};

const RESPONSE_ADVANCE_MS = 420;
const CALM_NOTIFICATION_MESSAGES = {
  minor: ["Peripheral cue: stay steady.", "Soft reminder: keep your rhythm."],
  visual: ["Focus check: continue the sequence.", "Calm prompt: keep tracking the stream."],
  audio: ["High-priority cue: re-center attention.", "Gentle chime: return focus to the task."],
};

const DEFAULT_PARTICIPANT = {
  name: "",
  rollNumber: "",
};

const DEFAULT_SETTINGS = {
  nValue: 2,
  numTrials: 30,
  stimulusType: "letters",
  stimulusDuration: 2000,
  enableDistractions: true,
  distractionProbability: 30,
};

const PRACTICE_SETTINGS = {
  nValue: 2,
  numTrials: 6,
  stimulusType: "letters",
  stimulusDuration: 1600,
  enableDistractions: false,
  distractionProbability: 0,
};

function getFeedbackCopy(isTarget, userResponded) {
  if (isTarget && userResponded) {
    return { text: "Correct hit", kind: "correct" };
  }
  if (!isTarget && !userResponded) {
    return { text: "Correct rejection", kind: "correct" };
  }
  if (isTarget && !userResponded) {
    return { text: "Miss", kind: "incorrect" };
  }
  return { text: "False alarm", kind: "incorrect" };
}

function getNotificationLevel(probability) {
  if (probability >= 70) {
    const pick = Math.random();
    if (pick < 0.25) return "minor";
    if (pick < 0.7) return "visual";
    return "audio";
  }
  if (probability >= 40) {
    return Math.random() < 0.65 ? "visual" : "minor";
  }
  return "minor";
}

function computeInsights(responses) {
  if (!responses?.length) {
    return {
      trendLabel: "Not enough data",
      stabilityScore: 0,
      distractionResilience: 100,
      affirmation: "You completed the session with calm persistence.",
    };
  }

  const reactionTimes = responses
    .map((entry) => Number(entry.reactionTime || 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  const firstHalf = reactionTimes.slice(0, Math.max(1, Math.floor(reactionTimes.length / 2)));
  const secondHalf = reactionTimes.slice(Math.max(1, Math.floor(reactionTimes.length / 2)));
  const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;

  let trendLabel = "Stable response pace";
  if (firstAvg && secondAvg < firstAvg * 0.94) {
    trendLabel = "Improving response pace";
  } else if (secondAvg > firstAvg * 1.06) {
    trendLabel = "Pace slowed over time";
  }

  const mean = reactionTimes.length ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
  const variance =
    reactionTimes.length > 1
      ? reactionTimes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / reactionTimes.length
      : 0;
  const std = Math.sqrt(variance);
  const stabilityScore =
    mean > 0 ? Math.max(0, Math.min(100, Math.round(100 - (std / mean) * 100))) : 0;

  const distractedTrials = responses.filter((entry) => entry.hadNotification);
  const distractionResilience = distractedTrials.length
    ? Math.round(
        (distractedTrials.filter((entry) => entry.correct).length / distractedTrials.length) * 100
      )
    : 100;

  return {
    trendLabel,
    stabilityScore,
    distractionResilience,
    affirmation:
      stabilityScore >= 70
        ? "You maintained a steady and calm focus pattern."
        : "You stayed engaged; consistency can improve with another run.",
  };
}

export default function App() {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [participant, setParticipant] = useState(DEFAULT_PARTICIPANT);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pendingTestSettings, setPendingTestSettings] = useState(DEFAULT_SETTINGS);

  const [runSettings, setRunSettings] = useState(PRACTICE_SETTINGS);
  const [runKind, setRunKind] = useState("practice");

  const [sequence, setSequence] = useState([]);
  const [targetFlags, setTargetFlags] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState({ text: "", kind: "" });
  const [results, setResults] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [trialProgress, setTrialProgress] = useState(0);
  const [progressTransitionMs, setProgressTransitionMs] = useState(0);
  const [introError, setIntroError] = useState("");
  const [countdownValue, setCountdownValue] = useState(3);
  const [practiceRoundCompleted, setPracticeRoundCompleted] = useState(false);

  const [notification, setNotification] = useState({
    visible: false,
    text: "",
    level: "minor",
  });
  const [notificationCounts, setNotificationCounts] = useState({
    minor: 0,
    visual: 0,
    audio: 0,
  });
  const [reflectionResponse, setReflectionResponse] = useState({
    focusedFeeling: "",
    interruptionEffect: "",
  });

  const trialStartTimeRef = useRef(0);
  const trialLockedRef = useRef(false);
  const responseTimerRef = useRef(null);
  const nextTrialTimerRef = useRef(null);
  const progressRafRef = useRef(null);
  const notificationTimerRef = useRef(null);
  const notificationHideTimerRef = useRef(null);
  const trialNotificationRef = useRef({ shown: false, level: null });
  const notificationTotalRef = useRef(0);
  const audioContextRef = useRef(null);

  const currentStimulus = sequence[currentTrial];
  const isRunActive = phase === PHASES.PRACTICE || phase === PHASES.TEST;
  const isResponseEnabled = isRunActive && currentTrial >= runSettings.nValue;

  const clearTimers = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    if (nextTrialTimerRef.current) {
      clearTimeout(nextTrialTimerRef.current);
      nextTrialTimerRef.current = null;
    }
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    if (notificationHideTimerRef.current) {
      clearTimeout(notificationHideTimerRef.current);
      notificationHideTimerRef.current = null;
    }
  }, []);

  const playSoftChime = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!audioContextRef.current) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) {
        return;
      }
      audioContextRef.current = new Context();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(512, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.36);
  }, []);

  const startProgressFor = useCallback(() => {
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }

    setProgressTransitionMs(0);
    setTrialProgress(0);

    const tick = () => {
      if (!isRunActive) {
        progressRafRef.current = null;
        return;
      }

      const elapsed = performance.now() - trialStartTimeRef.current;
      const ratio = Math.min(1, elapsed / runSettings.stimulusDuration);
      setTrialProgress(ratio * 100);

      if (ratio < 1) {
        progressRafRef.current = requestAnimationFrame(tick);
      } else {
        progressRafRef.current = null;
      }
    };

    progressRafRef.current = requestAnimationFrame(tick);
  }, [isRunActive, runSettings.stimulusDuration]);

  const submitResults = useCallback(
    async (finalResults) => {
      setSaveStatus("saving");
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          participant,
          settings: {
            ...settings,
            calmFeaturesEnabled: true,
          },
          results: {
            ...finalResults,
            notificationCounts,
            reflectionResponse,
            practiceRoundCompleted,
          },
          calmFeaturesEnabled: true,
          notificationCounts,
          reflectionResponse,
          practiceRoundCompleted,
        };

        const response = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [notificationCounts, participant, practiceRoundCompleted, reflectionResponse, settings]
  );

  const finishRun = useCallback(
    (allResponses, kind) => {
      clearTimers();

      if (kind === "practice") {
        setPracticeRoundCompleted(true);
        setPhase(PHASES.SETTINGS);
        return;
      }

      const scoredResponses = allResponses.filter((entry) => entry.trial >= settings.nValue);
      const baseResults = calculateResults(scoredResponses, 0);
      const insights = computeInsights(scoredResponses);

      const enrichedResults = {
        ...baseResults,
        completedTrials: allResponses.length,
        totalTrials: runSettings.numTrials,
        notificationCounts,
        calmFeaturesEnabled: true,
        practiceRoundCompleted,
        reflectionResponse,
        reactionTrend: insights.trendLabel,
        stabilityScore: insights.stabilityScore,
        distractionResilienceScore: insights.distractionResilience,
        affirmation: insights.affirmation,
      };

      setResults(enrichedResults);
      setSaveStatus("idle");
      setPhase(PHASES.RESULTS);
    },
    [clearTimers, notificationCounts, practiceRoundCompleted, reflectionResponse, runSettings.numTrials, settings.nValue]
  );

  const handleResponse = useCallback(
    (userResponded, autoAdvance = false) => {
      if (!isRunActive || trialLockedRef.current || currentTrial >= runSettings.numTrials) {
        return;
      }

      if (!autoAdvance && currentTrial < runSettings.nValue) {
        return;
      }

      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }

      trialLockedRef.current = true;

      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      setProgressTransitionMs(0);
      setTrialProgress(100);

      const isTarget = targetFlags[currentTrial];
      const reactionTime = autoAdvance
        ? runSettings.stimulusDuration
        : Math.round(performance.now() - trialStartTimeRef.current);

      const feedbackCopy = getFeedbackCopy(isTarget, userResponded);
      setFeedback(feedbackCopy);

      const response = {
        trial: currentTrial,
        isTarget,
        userResponded,
        reactionTime,
        hadNotification: trialNotificationRef.current.shown,
        notificationLevel: trialNotificationRef.current.level,
        correct: feedbackCopy.kind === "correct",
      };

      setResponses((prev) => {
        const next = [...prev, response];

        nextTrialTimerRef.current = setTimeout(() => {
          if (currentTrial + 1 >= runSettings.numTrials) {
            finishRun(next, runKind);
          } else {
            setCurrentTrial((value) => Math.min(value + 1, runSettings.numTrials - 1));
          }
        }, RESPONSE_ADVANCE_MS);

        return next;
      });
    },
    [currentTrial, finishRun, isRunActive, runKind, runSettings.numTrials, runSettings.nValue, runSettings.stimulusDuration, targetFlags]
  );

  const beginRun = useCallback((nextSettings, nextKind, nextPhase) => {
    const generated = generateSequence(nextSettings);

    clearTimers();
    setRunKind(nextKind);
    setRunSettings(nextSettings);
    setSequence(generated.sequence);
    setTargetFlags(generated.targetFlags);
    setCurrentTrial(0);
    setResponses([]);
    setFeedback({ text: "", kind: "" });
    setTrialProgress(0);
    setProgressTransitionMs(0);
    setNotification({ visible: false, text: "", level: "minor" });
    setPhase(nextPhase);
  }, [clearTimers]);

  useEffect(() => {
    if (phase !== PHASES.COUNTDOWN) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          beginRun(pendingTestSettings, "test", PHASES.TEST);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [beginRun, pendingTestSettings, phase]);

  useEffect(() => {
    if (!isRunActive) {
      return undefined;
    }

    if (currentTrial >= runSettings.numTrials) {
      return undefined;
    }

    trialLockedRef.current = false;
    trialNotificationRef.current = { shown: false, level: null };

    setProgressTransitionMs(0);
    trialStartTimeRef.current = performance.now();
    startProgressFor();

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }

    if (notificationHideTimerRef.current) {
      clearTimeout(notificationHideTimerRef.current);
      notificationHideTimerRef.current = null;
    }

    setNotification((prev) => (prev.visible ? { ...prev, visible: false } : prev));

    const probability = Math.max(0, Math.min(100, Number(runSettings.distractionProbability ?? 0)));

    const shouldForceMidSessionCue =
      phase === PHASES.TEST &&
      runSettings.enableDistractions &&
      notificationTotalRef.current === 0 &&
      currentTrial >= Math.floor(runSettings.numTrials / 2);

    if (
      phase === PHASES.TEST &&
      runSettings.enableDistractions &&
      (Math.random() < probability / 100 || shouldForceMidSessionCue)
    ) {
      const minDelay = 220;
      const maxDelay = Math.max(minDelay, runSettings.stimulusDuration - 260);
      const showDelay =
        maxDelay <= minDelay
          ? minDelay
          : Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      notificationTimerRef.current = setTimeout(() => {
        const level = getNotificationLevel(probability);
        const source = CALM_NOTIFICATION_MESSAGES[level];
        const text = source[Math.floor(Math.random() * source.length)];

        trialNotificationRef.current = { shown: true, level };

        setNotificationCounts((prev) => ({
          ...prev,
          [level]: prev[level] + 1,
        }));

        setNotification({
          visible: true,
          text,
          level,
        });

        if (level === "audio") {
          playSoftChime();
        }

        notificationHideTimerRef.current = setTimeout(() => {
          setNotification((prev) => ({ ...prev, visible: false }));
          notificationHideTimerRef.current = null;
        }, 3500);

        notificationTimerRef.current = null;
      }, showDelay);
    }

    responseTimerRef.current = setTimeout(() => {
      handleResponse(false, true);
    }, runSettings.stimulusDuration);

    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      if (notificationHideTimerRef.current) {
        clearTimeout(notificationHideTimerRef.current);
        notificationHideTimerRef.current = null;
      }
    };
  }, [currentTrial, handleResponse, isRunActive, phase, playSoftChime, runSettings, startProgressFor]);

  useEffect(() => {
    if (!isRunActive) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (currentTrial < runSettings.nValue) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handleResponse(true);
      } else if (event.code === "Enter") {
        event.preventDefault();
        handleResponse(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentTrial, handleResponse, isRunActive, runSettings.nValue]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    notificationTotalRef.current =
      notificationCounts.minor + notificationCounts.visual + notificationCounts.audio;
  }, [notificationCounts]);

  const trialCounterLabel = useMemo(
    () => `Trial ${Math.min(currentTrial + 1, runSettings.numTrials)} / ${runSettings.numTrials}`,
    [currentTrial, runSettings.numTrials]
  );
  const totalNotifications =
    notificationCounts.minor + notificationCounts.visual + notificationCounts.audio;

  const handleIntroContinue = (event) => {
    event.preventDefault();
    if (!participant.name.trim()) {
      setIntroError("Please enter your name to continue.");
      return;
    }
    setIntroError("");
    setPhase(PHASES.WELCOME);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <main className={`app-shell phase-${phase} ${isDarkMode ? "theme-dark" : "theme-light"}`}>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? "Light mode" : "Dark mode"}
      </button>
      {phase === PHASES.INTRO && (
        <IntroScreen
          participant={participant}
          introError={introError}
          onParticipantChange={(field, value) =>
            setParticipant((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onContinue={handleIntroContinue}
        />
      )}

      {phase === PHASES.WELCOME && (
        <WelcomeScreen
          participantName={participant.name}
          onBack={() => setPhase(PHASES.INTRO)}
          onContinue={() => setPhase(PHASES.RULES)}
        />
      )}

      {phase === PHASES.RULES && (
        <RulesScreen
          onBack={() => setPhase(PHASES.WELCOME)}
          onContinue={() => setPhase(PHASES.PRACTICE_INFO)}
        />
      )}

      {phase === PHASES.PRACTICE_INFO && (
        <section className="screen-pane screen practice-info-screen">
          <h2>Warm-Up Round</h2>
          <p className="subtitle">This is just a warm-up. You will complete 6 practice trials with immediate feedback.</p>
          <ul className="rules-list compact">
            <li>Practice uses calm mode with no distractions.</li>
            <li>It helps stabilize your baseline before the real session.</li>
            <li>Your practice score is not included in the final result.</li>
          </ul>
          <div className="actions between">
            <button type="button" onClick={() => setPhase(PHASES.RULES)}>
              Back
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => beginRun(PRACTICE_SETTINGS, "practice", PHASES.PRACTICE)}
            >
              Start Practice
            </button>
          </div>
        </section>
      )}

      {phase === PHASES.PRACTICE && (
        <TestScreen
          title="Practice Round"
          subtitle="Warm-up mode with immediate feedback"
          trialCounterLabel={trialCounterLabel}
          nValue={runSettings.nValue}
          trialProgress={trialProgress}
          progressTransitionMs={progressTransitionMs}
          stimulusType={runSettings.stimulusType}
          currentStimulus={currentStimulus}
          currentIsTarget={Boolean(targetFlags[currentTrial])}
          isResponseEnabled={isResponseEnabled}
          onMatch={() => handleResponse(true)}
          onNoMatch={() => handleResponse(false)}
          onEndTest={() => finishRun(responses, "practice")}
          feedback={feedback}
          notification={notification}
          totalNotifications={totalNotifications}
          calmMode
        />
      )}

      {phase === PHASES.SETTINGS && (
        <SettingsScreen
          settings={settings}
          onSettingsChange={(field, value) =>
            setSettings((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onBack={() => setPhase(practiceRoundCompleted ? PHASES.PRACTICE_INFO : PHASES.RULES)}
          onStart={() => {
            setPendingTestSettings(settings);
            setCountdownValue(3);
            setPhase(PHASES.COUNTDOWN);
          }}
        />
      )}

      {phase === PHASES.COUNTDOWN && <CountdownScreen countdownValue={countdownValue} />}

      {phase === PHASES.TEST && (
        <TestScreen
          title="Calm N-Back Session"
          subtitle="Peripheral cues only. Stay focused on the sequence."
          trialCounterLabel={trialCounterLabel}
          nValue={runSettings.nValue}
          trialProgress={trialProgress}
          progressTransitionMs={progressTransitionMs}
          stimulusType={runSettings.stimulusType}
          currentStimulus={currentStimulus}
          currentIsTarget={Boolean(targetFlags[currentTrial])}
          isResponseEnabled={isResponseEnabled}
          onMatch={() => handleResponse(true)}
          onNoMatch={() => handleResponse(false)}
          onEndTest={() => finishRun(responses, "test")}
          feedback={feedback}
          notification={notification}
          totalNotifications={totalNotifications}
          calmMode
        />
      )}

      {phase === PHASES.RESULTS && (
        <ResultsScreen
          participantName={participant.name}
          results={results}
          saveStatus={saveStatus}
          reflectionResponse={reflectionResponse}
          onReflectionChange={(field, value) =>
            setReflectionResponse((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSave={() => submitResults(results)}
          onNewParticipant={() => {
            setParticipant(DEFAULT_PARTICIPANT);
            setSettings(DEFAULT_SETTINGS);
            setPendingTestSettings(DEFAULT_SETTINGS);
            setPracticeRoundCompleted(false);
            setNotificationCounts({ minor: 0, visual: 0, audio: 0 });
            setReflectionResponse({ focusedFeeling: "", interruptionEffect: "" });
            setResults(null);
            setPhase(PHASES.INTRO);
          }}
          onRunAnother={() => {
            setResults(null);
            setSaveStatus("idle");
            setNotificationCounts({ minor: 0, visual: 0, audio: 0 });
            setReflectionResponse({ focusedFeeling: "", interruptionEffect: "" });
            setPhase(PHASES.SETTINGS);
          }}
        />
      )}
    </main>
  );
}
