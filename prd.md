# Product Requirements Document (PRD)

# Calm Technology Version

**Product Name:** CalmUX Lab – Calm Condition  
**Type:** Web-Based Experimental N-Back Platform  

---

## 1. Overview

The Calm Version is a non-intrusive, peripheral-first interaction design of the N-back experiment platform.

Unlike the control condition, this version:
- Minimizes pop-ups  
- Uses ambient visual cues  
- Uses graded urgency notifications  
- Encourages reflection  
- Reduces cognitive interruption
The task structure and scoring logic remain identical to preserve experimental validity.

---

## 2. Research Positioning

Grounded in:

- Calm Technology principles (Weiser)
- Norman’s three processing levels (Visceral, Behavioral, Reflective)

The Calm condition evaluates:


| Level      | Design Intent                                |
| ---------- | -------------------------------------------- |
| Visceral   | Reduce stress through soft visual language   |
| Behavioral | Improve flow and reduce forced interruptions |
| Reflective | Increase meaning and memory of session       |


---

## 3. Core Design Philosophy

The Calm System should:

1. Stay in the periphery
2. Interrupt only when necessary
3. Use graded urgency (visual, minor audio, strong audio)
4. Prefer ambient cues over modal popups
5. Encourage post-task reflection
6. Preserve experimental timing precision

---

# 4. Experience Flow (Calm Condition)
Intro → Rules → Settings → Countdown → Test → Reflective Results  
- In settings page have a option for demo run
(Trial Round is new in Calm version.)

---

# 5. Functional Requirements – Calm Version

## FR1 — Intro Screen (Enhanced Calm Framing)

- Rules integrated into first screen  
- Soft gradient background  
- Rounded containers  
- Subtle fade transitions  
- Inline validation (no harsh red popups)

---

## FR2 — Trial Round (NEW)

Before actual experiment:

- 5–8 practice trials  
- Immediate feedback  
- No distractions  
- Message: “This is just a warm-up.”

Purpose:

- Reduce performance anxiety  
- Stabilize baseline performance

---

## FR3 — Calm Notification System

### Graded Urgency Levels


| Level  | Behavior           | Example         |
| ------ | ------------------ | --------------- |
| Minor  | Edge glow pulse    | Low distraction |
| Visual | Soft card fades in | Medium          |
| Audio  | Soft chime + glow  | High            |


### Non-Blocking Notifications

- Appear in corner  
- Fade after 3–5 seconds  
- Do not pause trial  
- Do not require click  
- Log appearance count

### Audio Notifications

- Soft ambient chime  
- Low volume  
- No repetition  
- Disabled by default unless high urgency

---

## FR4 — Distraction Handling

- No blocking popups  
- Subtle background desaturation  
- Soft floating indicator  
- Trial continues running  
- Track number of distractions shown

---

## FR5 — Visual Language

### Background System

- Slow gradient transitions  
- No sharp color shifts  
- Warm tones → target detected  
- Cool tones → neutral

### Popup / Card Colors

- Soft drop shadow  
- High contrast close button only when required  
- Avoid pure red

---

## FR6 — Behavioral Calm Enhancements

### Peripheral Progress

- Circular subtle ring  
- Or thin ambient wave at top

### Smooth Transitions

- 250–400ms fade  
- No instant screen cuts

---

## FR7 — Results Screen (Reflective Layer)

Features:

1. Soft animated loading state
2. Personalized affirmation messages
3. Visual metaphor (growth line, flow animation)
4. Additional insights (reaction trend, stability score, distraction resilience score)

---

## FR8 — Reflection Prompt (NEW)

Optional questions:

- “How focused did you feel?”  
- “Did interruptions affect you?”

Stored optionally in JSON.

---

# 6. Data Model Additions

Additional fields:

- calmFeaturesEnabled: boolean  
- notificationCounts: { minor, visual, audio }  
- reflectionResponse (optional)  
- practiceRoundCompleted: boolean

---

# 7. Experimental Integrity Constraints

- Same N values  
- Same trial durations  
- Same scoring formula  
- Same JSON schema (extended only)

---

# 8. Ethics & Psychological Considerations

- No stress-inducing colors  
- No loud alerts  
- No forced interruption loops  
- Opt-out available  
- Anonymous ID only

---

# 9. Success Metrics


| Dimension              | Expected Outcome        |
| ---------------------- | ----------------------- |
| Visceral               | Lower reported stress   |
| Behavioral             | Reduced false alarms    |
| Reflective             | Higher recall accuracy  |
| Distraction Resilience | Lower RT spike variance |


---

# 10. Comparison Summary


| Feature      | Control       | Calm                 |
| ------------ | ------------- | -------------------- |
| Popups       | Blocking      | Non-blocking         |
| Colors       | High contrast | Soft gradients       |
| Alerts       | Immediate     | Graded urgency       |
| Feedback     | Direct score  | Reflective narrative |
| Distractions | Modal         | Peripheral           |


---

# 11. Future Extensions

- Adaptive urgency system  
- Physiological signal integration  
- AI-based calm modulation

