/**
 * Main application container controlling the full N-back flow:
 * intro -> settings -> countdown -> test -> results.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountdownScreen from "./components/CountdownScreen";
import IntroScreen from "./components/IntroScreen";
import ResultsScreen from "./components/ResultsScreen";
import SettingsScreen from "./components/SettingsScreen";
import TestScreen from "./components/TestScreen";
import { calculateResults, generateSequence } from "./utils/nback";

const PHASES = {
  INTRO: "intro",
  SETTINGS: "settings",
  COUNTDOWN: "countdown",
  TEST: "test",
  RESULTS: "results",
};

const RESPONSE_ADVANCE_MS = 450;
const FEEDBACK_GAP_MS = 140;

const DISTRACTION_MESSAGES = [
  "Please close this popup and continue.",
  "Distraction check: close and refocus.",
  "Random reminder: return to the task.",
  "Ignore this prompt and keep tracking.",
];
const DEFAULT_PARTICIPANT = {
  name: "",
  rollNumber: "",
};

const DEFAULT_SETTINGS = {
  nValue: 2,
  numTrials: 30,
  stimulusType: "letters",
  stimulusDuration: 2000,
  enableDistractions: false,
  distractionProbability: 30,
};

export default function App() {
  const [phase, setPhase] = useState(PHASES.INTRO);

  const [participant, setParticipant] = useState(DEFAULT_PARTICIPANT);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

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
  const [distraction, setDistraction] = useState({ visible: false, text: "" });

  const trialStartTimeRef = useRef(0);
  const trialLockedRef = useRef(false);
  const responseTimerRef = useRef(null);
  const nextTrialTimerRef = useRef(null);
  const progressRafRef = useRef(null);
  const pendingFeedbackRef = useRef({ text: "", kind: "" });
  const feedbackDelayTimerRef = useRef(null);
  const distractionTimerRef = useRef(null);

  const currentStimulus = sequence[currentTrial];
  const isResponseEnabled = phase === PHASES.TEST && currentTrial >= settings.nValue;

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
    if (feedbackDelayTimerRef.current) {
      clearTimeout(feedbackDelayTimerRef.current);
      feedbackDelayTimerRef.current = null;
    }
    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
  }, []);

  const startProgressFor = useCallback((durationMs) => {
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }

    // Reset to 0 with no transition, then start a clean 0->100 transition.
    setProgressTransitionMs(0);
    setTrialProgress(0);

    progressRafRef.current = requestAnimationFrame(() => {
      progressRafRef.current = requestAnimationFrame(() => {
        setProgressTransitionMs(durationMs);
        setTrialProgress(100);
        progressRafRef.current = null;
      });
    });
  }, []);

  const closeDistraction = useCallback(() => {
    setDistraction((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const beginTest = useCallback((nextSettings) => {
    const generated = generateSequence(nextSettings);
    setSettings(nextSettings);
    setSequence(generated.sequence);
    setTargetFlags(generated.targetFlags);
    setCurrentTrial(0);
    setResponses([]);
    trialLockedRef.current = false;
    setTrialProgress(0);
    setProgressTransitionMs(0);
    setFeedback({ text: "", kind: "" });
    pendingFeedbackRef.current = { text: "", kind: "" };
    setResults(null);
    setSaveStatus("idle");
    setCountdownValue(3);
    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
    setDistraction({ visible: false, text: "" });
    setPhase(PHASES.COUNTDOWN);
  }, []);

  useEffect(() => {
    if (phase !== PHASES.COUNTDOWN) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setPhase(PHASES.TEST);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [phase]);

  const submitResults = useCallback(
    async (finalResults) => {
      setSaveStatus("saving");
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          participant,
          settings,
          results: finalResults,
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
    [participant, settings]
  );

  const finishTest = useCallback(
    (allResponses) => {
      clearTimers();
      const finalResults = calculateResults(allResponses, settings.nValue);
      setResults(finalResults);
      setPhase(PHASES.RESULTS);
      submitResults(finalResults);
    },
    [clearTimers, settings.nValue, submitResults]
  );

  const handleResponse = useCallback(
    (userResponded, autoAdvance = false) => {
      if (phase !== PHASES.TEST || trialLockedRef.current || currentTrial >= settings.numTrials) {
        return;
      }

      if (!autoAdvance && currentTrial < settings.nValue) {
        return;
      }

      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
      trialLockedRef.current = true;

      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      setProgressTransitionMs(0);
      setTrialProgress(100);

      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
        distractionTimerRef.current = null;
      }
      closeDistraction();

      const isTarget = targetFlags[currentTrial];
      const reactionTime = autoAdvance
        ? settings.stimulusDuration
        : Math.round(performance.now() - trialStartTimeRef.current);

      let text = "";
      let kind = "";
      if (isTarget && userResponded) {
        text = "Correct hit";
        kind = "correct";
      } else if (!isTarget && !userResponded) {
        text = "Correct rejection";
        kind = "correct";
      } else if (isTarget && !userResponded) {
        text = "Miss";
        kind = "incorrect";
      } else {
        text = "False alarm";
        kind = "incorrect";
      }

      // Delay status display: show this trial's status at start of next trial.
      pendingFeedbackRef.current = { text, kind };

      const response = {
        trial: currentTrial,
        isTarget,
        userResponded,
        reactionTime,
      };

      setResponses((prev) => {
        const next = [...prev, response];

        nextTrialTimerRef.current = setTimeout(() => {
          if (currentTrial + 1 >= settings.numTrials) {
            finishTest(next);
          } else {
            setCurrentTrial((value) => Math.min(value + 1, settings.numTrials - 1));
          }
        }, RESPONSE_ADVANCE_MS);

        return next;
      });
    },
    [closeDistraction, currentTrial, finishTest, phase, settings.nValue, settings.numTrials, settings.stimulusDuration, targetFlags]
  );

  useEffect(() => {
    if (phase !== PHASES.TEST) {
      return undefined;
    }

    if (currentTrial >= settings.numTrials) {
      return undefined;
    }

    trialLockedRef.current = false;
    const nextFeedback = pendingFeedbackRef.current.text ? { ...pendingFeedbackRef.current } : null;
    pendingFeedbackRef.current = { text: "", kind: "" };
    setFeedback({ text: "", kind: "" });

    if (feedbackDelayTimerRef.current) {
      clearTimeout(feedbackDelayTimerRef.current);
      feedbackDelayTimerRef.current = null;
    }
    if (nextFeedback) {
      feedbackDelayTimerRef.current = setTimeout(() => {
        setFeedback(nextFeedback);
        feedbackDelayTimerRef.current = null;
      }, FEEDBACK_GAP_MS);
    }

    trialStartTimeRef.current = performance.now();
    startProgressFor(settings.stimulusDuration);

    if (distractionTimerRef.current) {
      clearTimeout(distractionTimerRef.current);
      distractionTimerRef.current = null;
    }
    closeDistraction();

    const distractionProbability = Math.max(0, Math.min(100, Number(settings.distractionProbability ?? 30)));

    if (settings.enableDistractions && Math.random() < distractionProbability / 100) {
      const minDelay = 220;
      const maxDelay = Math.max(minDelay, settings.stimulusDuration - 220);
      const showDelay =
        maxDelay <= minDelay
          ? minDelay
          : Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      distractionTimerRef.current = setTimeout(() => {
        if (trialLockedRef.current) {
          distractionTimerRef.current = null;
          return;
        }

        const text = DISTRACTION_MESSAGES[Math.floor(Math.random() * DISTRACTION_MESSAGES.length)];
        setDistraction({
          visible: true,
          text,
        });
        distractionTimerRef.current = null;
      }, showDelay);
    }

    responseTimerRef.current = setTimeout(() => {
      handleResponse(false, true);
    }, settings.stimulusDuration);

    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      if (feedbackDelayTimerRef.current) {
        clearTimeout(feedbackDelayTimerRef.current);
        feedbackDelayTimerRef.current = null;
      }
      if (distractionTimerRef.current) {
        clearTimeout(distractionTimerRef.current);
        distractionTimerRef.current = null;
      }
    };
  }, [
    closeDistraction,
    currentTrial,
    handleResponse,
    phase,
    settings.enableDistractions,
    settings.distractionProbability,
    settings.numTrials,
    settings.stimulusDuration,
    startProgressFor,
  ]);

  useEffect(() => {
    if (phase !== PHASES.TEST) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.code === "Escape" && distraction.visible) {
        event.preventDefault();
        closeDistraction();
        return;
      }

      if (currentTrial < settings.nValue) {
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
  }, [closeDistraction, currentTrial, distraction.visible, handleResponse, phase, settings.nValue]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const trialCounterLabel = useMemo(
    () => `Trial ${Math.min(currentTrial + 1, settings.numTrials)} / ${settings.numTrials}`,
    [currentTrial, settings.numTrials]
  );

  const handleIntroContinue = (event) => {
    event.preventDefault();
    if (!participant.name.trim()) {
      setIntroError("Name is required.");
      return;
    }
    setIntroError("");
    setPhase(PHASES.SETTINGS);
  };

  return (
    <main className="app-shell">
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

      {phase === PHASES.SETTINGS && (
        <SettingsScreen
          settings={settings}
          onSettingsChange={(field, value) =>
            setSettings((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onBack={() => setPhase(PHASES.INTRO)}
          onStart={() => beginTest(settings)}
        />
      )}

      {phase === PHASES.COUNTDOWN && <CountdownScreen countdownValue={countdownValue} />}

      {phase === PHASES.TEST && (
        <TestScreen
          trialCounterLabel={trialCounterLabel}
          nValue={settings.nValue}
          trialProgress={trialProgress}
          progressTransitionMs={progressTransitionMs}
          stimulusType={settings.stimulusType}
          currentStimulus={currentStimulus}
          isResponseEnabled={isResponseEnabled}
          onMatch={() => handleResponse(true)}
          onNoMatch={() => handleResponse(false)}
          feedback={feedback}
          distraction={distraction}
          onCloseDistraction={closeDistraction}
        />
      )}

      {phase === PHASES.RESULTS && (
        <ResultsScreen
          participantName={participant.name}
          results={results}
          saveStatus={saveStatus}
          onNewParticipant={() => {
            setParticipant(DEFAULT_PARTICIPANT);
            setSettings(DEFAULT_SETTINGS);
            setResults(null);
            setPhase(PHASES.INTRO);
          }}
          onRunAnother={() => {
            setResults(null);
            setPhase(PHASES.SETTINGS);
          }}
        />
      )}
    </main>
  );
}





















