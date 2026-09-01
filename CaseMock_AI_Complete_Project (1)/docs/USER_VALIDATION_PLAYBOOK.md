# CaseMock AI — User Validation & Testing Playbook

Use this actionable guide to gather 15–30 real user test sessions, quantitative metrics, and interview feedback within hours.

---

## 1. Fast Distribution Channels & Outreach Scripts

### Channel 1: Reddit (`r/ProductManagement`, `r/cscareerquestions`, `r/consulting`)
**Title:** *I built an interactive AI Avatar to practice PM mock interviews out loud (Looking for honest feedback from APM/PM applicants!)*  
**Post Body:**
> "Hey everyone! Preparing for PM/APM interviews, I found text chatbots like ChatGPT felt completely unrealistic because they don't simulate real-time conversational pressure, vocal pacing, or interviewer reactions.
> 
> I built **CaseMock AI**—a free, voice-driven AI PM interviewer named Alex who nods, reacts in real time, and gives you an instant CIRCLES/STAR scorecard after a 3-turn case.
> 
> Try a 3-minute mock here: `[YOUR_LIVE_LINK]`
> 
> Would love to hear:
> 1. Did speaking out loud to Alex feel realistic?
> 2. Did the scorecard accurately reflect your structure and trade-offs?"

---

### Channel 2: WhatsApp / Discord Student & PM Cohort Groups
**Message:**
> *"Hey everyone! 🚀 I'm testing an AI Avatar mock interviewer for PM/consulting interviews that actually listens to your voice and grades your CIRCLES framework and pacing in real time. Can 5 of you test a 3-minute mock session and give me brutal feedback? Link: `[YOUR_LIVE_LINK]`"*

---

## 2. Qualitative User Interview Script (10-Minute User Interview)

When debriefing users after their mock session, ask these 5 core questions:

1. **Pre-Mock Baseline:** *"Before using CaseMock AI, how did you usually practice for live interviews, and what was most frustrating about that process?"*
2. **The Avatar Reaction:** *"When Alex was listening and nodding as you spoke, how did that feel compared to reading text responses in ChatGPT?"*
3. **Conversational Pressure:** *"Did having the webcam mirror, timer, and voice interface create a realistic sense of interview adrenaline for you?"*
4. **Diagnostic Value:** *"Looking at your diagnostic scorecard (Structure, Empathy, Metrics, Vocal Delivery), which piece of feedback was most actionable?"*
5. **Willingness to Pay / Retention:** *"If we launched specialized company tracks (e.g. Google APM or Meta RPM calibrated interviewers), how often would you use this before an upcoming interview loop?"*

---

## 3. Metrics Tracking Checklist

- [ ] **Completed Sessions:** Track total mock completions via `/api/telemetry/stats`.
- [ ] **Confidence Delta:** Average change between baseline and post-session confidence.
- [ ] **Session Duration:** Average time spent in live sparring.
- [ ] **Waitlist Signups:** Number of emails collected for company tracks.
- [ ] **NPS Rating:** Average star rating submitted on the scorecard modal.
