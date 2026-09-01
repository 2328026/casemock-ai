// CaseMock AI - Interactive Client Logic

document.addEventListener("DOMContentLoaded", () => {
  // State
  let tracks = {};
  let currentTrackId = "product_design";
  let currentQuestionId = "pd_1";
  let preConfidence = 3;
  let postConfidence = 5;
  let turnIndex = 0;
  let transcript = [];
  let sessionTimerInterval = null;
  let sessionSeconds = 0;
  let isRecording = false;
  let recognition = null;
  let mediaStream = null;

  // DOM Elements
  const screenSetup = document.getElementById("screen-setup");
  const screenInterview = document.getElementById("screen-interview");
  const selectQuestion = document.getElementById("select-question");
  const btnStartInterview = document.getElementById("btn-start-interview");
  const btnEndEarly = document.getElementById("btn-end-early");
  const sessionTimer = document.getElementById("session-timer");
  const interviewTrackBadge = document.getElementById("interview-track-badge");
  
  // Avatar Elements
  const alexAvatar = document.getElementById("alex-avatar");
  const avatarStatePill = document.getElementById("avatar-state-pill");
  const avatarStateText = document.getElementById("avatar-state-text");
  const interviewerSpeechText = document.getElementById("interviewer-speech-text");
  const coachHintText = document.getElementById("coach-hint-text");

  // User Response Elements
  const userTranscriptInput = document.getElementById("user-transcript-input");
  const wordCountBadge = document.getElementById("word-count-badge");
  const btnToggleMic = document.getElementById("btn-toggle-mic");
  const micButtonLabel = document.getElementById("mic-button-label");
  const sttActiveIndicator = document.getElementById("stt-active-indicator");
  const btnSubmitTurn = document.getElementById("btn-submit-turn");
  const userWebcam = document.getElementById("user-webcam");
  const toggleCameraMirror = document.getElementById("toggle-camera-mirror");

  // Modals
  const modalScorecard = document.getElementById("modal-scorecard");
  const modalTelemetry = document.getElementById("modal-telemetry");
  const modalWaitlist = document.getElementById("modal-waitlist");

  // Initial Fetch Tracks
  fetchTracks();
  initWebSpeech();

  // Track Card Selection
  document.querySelectorAll(".track-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".track-card").forEach(c => c.classList.remove("selected", "border-2", "border-indigo-500"));
      card.classList.add("selected", "border-2", "border-indigo-500");
      currentTrackId = card.getAttribute("data-track");
      populateQuestions(currentTrackId);
    });
  });

  // Pre-Confidence Stars
  const preStarBtns = document.querySelectorAll("#pre-confidence-stars .star-btn");
  preStarBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      preConfidence = parseInt(btn.getAttribute("data-val"));
      renderStars(preStarBtns, preConfidence);
    });
  });

  // Post-Feedback Stars
  const fbStarBtns = document.querySelectorAll("#post-feedback-stars .fb-star");
  fbStarBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      postConfidence = parseInt(btn.getAttribute("data-val"));
      renderStars(fbStarBtns, postConfidence);
    });
  });

  function renderStars(btnList, rating) {
    btnList.forEach(b => {
      const val = parseInt(b.getAttribute("data-val"));
      const icon = b.querySelector("i");
      if (val <= rating) {
        b.className = b.className.replace("text-slate-600", "text-amber-400");
        if (icon) {
          icon.setAttribute("class", "w-5 h-5 fill-amber-400 text-amber-400");
        }
      } else {
        b.className = b.className.replace("text-amber-400", "text-slate-600");
        if (icon) {
          icon.setAttribute("class", "w-5 h-5 text-slate-600");
        }
      }
    });
    if (window.lucide) lucide.createIcons();
  }

  // Word count tracker
  userTranscriptInput.addEventListener("input", () => {
    const words = userTranscriptInput.value.trim().split(/\s+/).filter(Boolean).length;
    wordCountBadge.textContent = `${words} words`;
  });

  // Fetch Tracks Data
  async function fetchTracks() {
    try {
      const res = await fetch("/api/tracks");
      const data = await res.json();
      if (data.success) {
        tracks = data.tracks;
        populateQuestions(currentTrackId);
      }
    } catch (e) {
      console.warn("Backend not reached, using local track presets:", e);
      tracks = getLocalTrackFallback();
      populateQuestions(currentTrackId);
    }
  }

  function populateQuestions(trackId) {
    const track = tracks[trackId];
    if (!track) return;
    selectQuestion.innerHTML = "";
    track.questions.forEach(q => {
      const opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = `${q.prompt}`;
      selectQuestion.appendChild(opt);
    });
    currentQuestionId = track.questions[0].id;
  }

  selectQuestion.addEventListener("change", (e) => {
    currentQuestionId = e.target.value;
  });

  // START INTERVIEW
  btnStartInterview.addEventListener("click", async () => {
    screenSetup.classList.add("hidden");
    screenInterview.classList.remove("hidden");
    
    // Set Track Badge
    const trackName = tracks[currentTrackId] ? tracks[currentTrackId].title : "Product Design";
    interviewTrackBadge.textContent = trackName;

    // Start Webcam if enabled
    if (toggleCameraMirror.checked) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        userWebcam.srcObject = mediaStream;
      } catch (err) {
        console.log("Webcam access optional/denied:", err);
      }
    }

    // Reset State
    turnIndex = 0;
    transcript = [];
    sessionSeconds = 0;
    startTimer();
    updateStepProgress(1);

    // Initial Question Setup
    const questionObj = tracks[currentTrackId].questions.find(q => q.id === currentQuestionId) || tracks[currentTrackId].questions[0];
    const initialPrompt = questionObj.prompt;

    transcript.push({ speaker: "alex", text: initialPrompt });
    interviewerSpeechText.textContent = initialPrompt;
    speakAlex(initialPrompt);
  });

  // Turn Progress Indicator
  function updateStepProgress(step) {
    const step1 = document.getElementById("step-turn-1");
    const step2 = document.getElementById("step-turn-2");
    const step3 = document.getElementById("step-turn-3");

    [step1, step2, step3].forEach((el, idx) => {
      if (idx + 1 === step) {
        el.classList.remove("opacity-50");
        el.querySelector("span:first-child").className = "w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]";
      } else if (idx + 1 < step) {
        el.classList.remove("opacity-50");
        el.querySelector("span:first-child").className = "w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]";
      } else {
        el.classList.add("opacity-50");
        el.querySelector("span:first-child").className = "w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]";
      }
    });
  }

  // Timer
  function startTimer() {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(() => {
      sessionSeconds++;
      const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, "0");
      const secs = String(sessionSeconds % 60).padStart(2, "0");
      sessionTimer.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  // SUBMIT TURN
  btnSubmitTurn.addEventListener("click", async () => {
    const userText = userTranscriptInput.value.trim();
    if (!userText) {
      userTranscriptInput.focus();
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    transcript.push({ speaker: "user", text: userText });
    userTranscriptInput.value = "";
    wordCountBadge.textContent = "0 words";

    setAvatarState("thinking");
    avatarStateText.textContent = "Alex is taking notes and evaluating your structure...";

    try {
      const res = await fetch("/api/evaluate-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: currentTrackId,
          questionId: currentQuestionId,
          turnIndex,
          userResponse: userText,
          history: transcript
        })
      });
      const data = await res.json();

      if (data.success) {
        handleTurnEvaluation(data);
      }
    } catch (e) {
      console.warn("Backend evaluation fallback:", e);
      handleTurnEvaluation({
        avatarState: "nodding",
        coachNote: "Strong points! Make sure to quantify your trade-offs with explicit metrics.",
        isFinalTurn: turnIndex >= 2,
        nextInterviewerSpeech: "Makes sense. How would you measure success and what key failure mode would you monitor?"
      });
    }
  });

  function handleTurnEvaluation(data) {
    turnIndex++;
    updateStepProgress(Math.min(3, turnIndex + 1));

    if (data.coachNote) {
      coachHintText.textContent = data.coachNote;
    }

    if (data.isFinalTurn || turnIndex >= 3) {
      finishInterview();
      return;
    }

    const nextSpeech = data.nextInterviewerSpeech;
    transcript.push({ speaker: "alex", text: nextSpeech });
    interviewerSpeechText.textContent = nextSpeech;
    speakAlex(nextSpeech);
  }

  // FINISH & GRADE
  btnEndEarly.addEventListener("click", () => {
    finishInterview();
  });

  async function finishInterview() {
    clearInterval(sessionTimerInterval);
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    setAvatarState("idle");
    avatarStateText.textContent = "Alex is compiling your PM Competency Scorecard...";

    try {
      const res = await fetch("/api/generate-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: currentTrackId,
          questionId: currentQuestionId,
          durationSeconds: sessionSeconds,
          transcript,
          preConfidence,
          postConfidence
        })
      });
      const data = await res.json();
      if (data.success) {
        renderScorecard(data.scorecard);
      }
    } catch (e) {
      renderScorecard(generateLocalScorecardFallback());
    }
  }

  function renderScorecard(scorecard) {
    document.getElementById("card-overall-score").textContent = scorecard.overallScore || 85;
    document.getElementById("card-percentile").textContent = `Top ${100 - (scorecard.percentile || 88)}%`;
    const gain = (postConfidence - preConfidence);
    document.getElementById("card-confidence-gain").textContent = `${gain >= 0 ? "+" : ""}${gain} Stars`;

    // Rubric Bars
    const rubrics = scorecard.rubrics;
    if (rubrics) {
      document.getElementById("score-structure").textContent = `${rubrics.structure.score}%`;
      document.getElementById("bar-structure").style.width = `${rubrics.structure.score}%`;

      document.getElementById("score-empathy").textContent = `${rubrics.userEmpathy.score}%`;
      document.getElementById("bar-empathy").style.width = `${rubrics.userEmpathy.score}%`;

      document.getElementById("score-metrics").textContent = `${rubrics.metricsThinking.score}%`;
      document.getElementById("bar-metrics").style.width = `${rubrics.metricsThinking.score}%`;

      document.getElementById("score-delivery").textContent = `${rubrics.vocalDelivery.score}%`;
      document.getElementById("bar-delivery").style.width = `${rubrics.vocalDelivery.score}%`;
    }

    // Strengths & Improvements
    const listStrengths = document.getElementById("list-strengths");
    listStrengths.innerHTML = "";
    (scorecard.strengths || ["Structured problem breakdown.", "Clear communication pacing."]).forEach(s => {
      const li = document.createElement("li");
      li.className = "flex items-start gap-1.5";
      li.innerHTML = `<span class="text-emerald-400 font-bold">•</span><span>${s}</span>`;
      listStrengths.appendChild(li);
    });

    const listImprovements = document.getElementById("list-improvements");
    listImprovements.innerHTML = "";
    (scorecard.improvements || ["Explicitly define your North Star & counter-metrics.", "Unpack user persona constraints before listing features."]).forEach(imp => {
      const li = document.createElement("li");
      li.className = "flex items-start gap-1.5";
      li.innerHTML = `<span class="text-amber-400 font-bold">•</span><span>${imp}</span>`;
      listImprovements.appendChild(li);
    });

    modalScorecard.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  }

  // AVATAR ANIMATIONS & VOICE SYNTHESIS
  function setAvatarState(state) {
    alexAvatar.className.baseVal = `w-full h-full drop-shadow-2xl avatar-${state}`;
    if (state === "nodding") {
      avatarStateText.textContent = "Alex is listening and nodding...";
    } else if (state === "thinking") {
      avatarStateText.textContent = "Alex is analyzing your solution...";
    } else if (state === "speaking") {
      avatarStateText.textContent = "Alex is speaking...";
    } else {
      avatarStateText.textContent = "Alex is ready.";
    }
  }

  function speakAlex(text) {
    if (!("speechSynthesis" in window)) {
      setAvatarState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;

    // Pick voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB") || v.lang.includes("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => {
      setAvatarState("speaking");
    };

    utterance.onend = () => {
      setAvatarState("nodding");
      avatarStateText.textContent = "Alex is listening attentively to your answer...";
    };

    utterance.onerror = () => {
      setAvatarState("idle");
    };

    window.speechSynthesis.speak(utterance);
  }

  // SPEECH RECOGNITION (STT)
  function initWebSpeech() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      micButtonLabel.textContent = "Voice STT Not Supported (Type Below)";
      btnToggleMic.classList.add("opacity-60");
      return;
    }

    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let currentResult = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentResult += event.results[i][0].transcript;
      }
      userTranscriptInput.value = currentResult;
      const words = currentResult.trim().split(/\s+/).filter(Boolean).length;
      wordCountBadge.textContent = `${words} words`;
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event.error);
      stopRecording();
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };
  }

  btnToggleMic.addEventListener("click", () => {
    if (!recognition) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  function startRecording() {
    if (!recognition) return;
    isRecording = true;
    try {
      recognition.start();
    } catch (e) {}
    btnToggleMic.classList.remove("bg-indigo-600", "hover:bg-indigo-500");
    btnToggleMic.classList.add("bg-rose-600", "hover:bg-rose-500", "animate-pulse");
    micButtonLabel.textContent = "Stop Speaking (Tap When Done)";
    sttActiveIndicator.classList.remove("hidden");
    setAvatarState("nodding");
  }

  function stopRecording() {
    isRecording = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    btnToggleMic.classList.remove("bg-rose-600", "hover:bg-rose-500", "animate-pulse");
    btnToggleMic.classList.add("bg-indigo-600", "hover:bg-indigo-500");
    micButtonLabel.textContent = "Tap to Speak";
    sttActiveIndicator.classList.add("hidden");
  }

  // FEEDBACK SUBMISSION
  document.getElementById("btn-submit-feedback").addEventListener("click", async () => {
    const comment = document.getElementById("input-feedback-comment").value.trim();
    try {
      await fetch("/api/telemetry/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: postConfidence,
          comment,
          role: "Candidate Mock"
        })
      });
      document.getElementById("feedback-success-msg").classList.remove("hidden");
      document.getElementById("input-feedback-comment").value = "";
    } catch (e) {
      document.getElementById("feedback-success-msg").classList.remove("hidden");
    }
  });

  // RESTART MOCK
  document.getElementById("btn-restart-mock").addEventListener("click", () => {
    modalScorecard.classList.add("hidden");
    screenInterview.classList.add("hidden");
    screenSetup.classList.remove("hidden");
  });

  // TELEMETRY MODAL CONTROLS
  document.getElementById("btn-open-telemetry").addEventListener("click", async () => {
    modalTelemetry.classList.remove("hidden");
    await loadTelemetryStats();
  });

  document.getElementById("btn-close-telemetry").addEventListener("click", () => {
    modalTelemetry.classList.add("hidden");
  });

  async function loadTelemetryStats() {
    try {
      const res = await fetch("/api/telemetry/stats");
      const data = await res.json();
      if (data.success) {
        const stats = data.stats;
        document.getElementById("stat-total-sessions").textContent = stats.totalSessions;
        document.getElementById("stat-avg-score").textContent = `${stats.avgScore}%`;
        document.getElementById("stat-avg-gain").textContent = `${stats.avgConfidenceGain} Stars`;
        document.getElementById("stat-avg-rating").textContent = `${stats.avgRating} / 5.0`;
        document.getElementById("stat-waitlist-count").textContent = `${stats.waitlistCount} Signups`;

        const feedList = document.getElementById("telemetry-feedback-list");
        feedList.innerHTML = "";
        stats.recentFeedback.forEach(fb => {
          const item = document.createElement("div");
          item.className = "bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs";
          item.innerHTML = `
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-amber-400">${"★".repeat(fb.rating)} (${fb.rating}/5)</span>
              <span class="text-[10px] text-slate-500">${new Date(fb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p class="text-slate-300">"${fb.comment || "Great avatar experience!"}"</p>
          `;
          feedList.appendChild(item);
        });
      }
    } catch (e) {
      console.warn("Failed loading telemetry:", e);
    }
  }

  // WAITLIST MODAL CONTROLS
  const openWl = () => {
    modalScorecard.classList.add("hidden");
    modalWaitlist.classList.remove("hidden");
  };

  document.getElementById("btn-open-waitlist").addEventListener("click", openWl);
  document.getElementById("btn-trigger-waitlist").addEventListener("click", openWl);
  document.getElementById("btn-close-waitlist").addEventListener("click", () => {
    modalWaitlist.classList.add("hidden");
  });

  document.getElementById("form-waitlist").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("input-wl-email").value.trim();
    const targetCompany = document.getElementById("input-wl-company").value;
    const role = document.getElementById("input-wl-role").value.trim();

    try {
      await fetch("/api/telemetry/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, targetCompany, role })
      });
      document.getElementById("wl-success-msg").classList.remove("hidden");
      setTimeout(() => {
        modalWaitlist.classList.add("hidden");
        document.getElementById("wl-success-msg").classList.add("hidden");
      }, 2000);
    } catch (e) {
      document.getElementById("wl-success-msg").classList.remove("hidden");
    }
  });

  // Fallbacks
  function getLocalTrackFallback() {
    return {
      product_design: {
        title: "Product Design & Sense",
        questions: [{ id: "pd_1", prompt: "Design an ATM specifically tailored for children aged 6 to 12." }]
      },
      behavioral: {
        title: "Leadership & Behavioral",
        questions: [{ id: "bh_1", prompt: "Tell me about a time you had a disagreement with an engineer on scope." }]
      },
      product_strategy: {
        title: "Strategy & Metrics",
        questions: [{ id: "ps_1", prompt: "Should Spotify launch a physical audio display device for families?" }]
      }
    };
  }

  function generateLocalScorecardFallback() {
    return {
      overallScore: 86,
      percentile: 90,
      rubrics: {
        structure: { score: 88 },
        userEmpathy: { score: 84 },
        metricsThinking: { score: 79 },
        vocalDelivery: { score: 85 }
      },
      strengths: [
        "Proactively outlined the 3-step solution roadmap.",
        "Articulated target user constraints and safety concerns."
      ],
      improvements: [
        "Include quantitative trade-offs for hardware BOM vs. software subscriptions.",
        "Define primary vs. counter-guardrail metrics explicitly."
      ]
    };
  }
});
