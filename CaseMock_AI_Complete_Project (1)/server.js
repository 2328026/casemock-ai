const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "telemetry_db.json");

// Ensure telemetry db exists with initial seed data
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      sessions: [
        {
          id: "sess_demo_01",
          track: "product_design",
          question: "Design an ATM for children aged 6-12",
          durationSeconds: 245,
          turns: 3,
          preConfidence: 2,
          postConfidence: 4,
          overallScore: 84,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: "sess_demo_02",
          track: "behavioral",
          question: "Tell me about a time you disagreed with an engineering lead on scope",
          durationSeconds: 185,
          turns: 2,
          preConfidence: 3,
          postConfidence: 5,
          overallScore: 91,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "sess_demo_03",
          track: "product_strategy",
          question: "Should Spotify launch a dedicated physical hardware device for audiobooks?",
          durationSeconds: 310,
          turns: 4,
          preConfidence: 2,
          postConfidence: 4,
          overallScore: 78,
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
        }
      ],
      feedbacks: [
        {
          id: "fb_01",
          rating: 5,
          comment: "The avatar's nodding and facial reactions made it feel so much more real than chatting with ChatGPT. Definitely gave me real interview adrenaline!",
          role: "Aspiring APM",
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: "fb_02",
          rating: 5,
          comment: "The instant CIRCLES framework breakdown helped me realize I completely skipped identifying user pain points before jumping into features.",
          role: "Final Year CS Major",
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString()
        }
      ],
      waitlist: [
        {
          email: "sarah.k@stanford.edu",
          targetCompany: "Google APM",
          role: "Undergrad Senior",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          email: "alex.chen@mit.edu",
          targetCompany: "Meta RPM",
          role: "Master's Student",
          timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

initDb();

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return { sessions: [], feedbacks: [], waitlist: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Interview Tracks & Questions Repository
const INTERVIEW_TRACKS = {
  product_design: {
    title: "Product Design & Sense",
    description: "Evaluates user empathy, problem segmentation, feature prioritization, and vision.",
    questions: [
      {
        id: "pd_1",
        prompt: "Design an ATM specifically tailored for children aged 6 to 12.",
        context: "The goal is financial literacy, safety, and engagement, backed by parental controls.",
        followUps: [
          "That's an interesting approach. How would you prioritize the top user segment within that age bracket (e.g. 6-8 vs 9-12)?",
          "What is the single highest-risk failure mode or edge case for this physical product?",
          "How would you measure success after a 6-month pilot deployment at local schools?"
        ]
      },
      {
        id: "pd_2",
        prompt: "How would you redesign the airport security waiting experience using hardware and software?",
        context: "Focus on reducing traveler anxiety, improving throughput, and maintaining strict security standards.",
        followUps: [
          "Great points. How would you handle non-tech-savvy passengers or international travelers with language barriers?",
          "Walk me through the primary trade-off between throughput speed and security screening depth.",
          "What North Star metric would you define for the airport operations authority?"
        ]
      }
    ]
  },
  behavioral: {
    title: "Leadership & Behavioral (STAR)",
    description: "Evaluates conflict resolution, stakeholder alignment, ownership, and learning from failure.",
    questions: [
      {
        id: "bh_1",
        prompt: "Tell me about a time you had a strong disagreement with a technical lead or senior stakeholder on project scope. How did you resolve it?",
        context: "Highlight your situational context, the specific action you took, and the quantifiable outcome.",
        followUps: [
          "Looking back, what data or evidence did you bring to change their mind, or did you compromise?",
          "If you had to do that project again from scratch, what would you do differently to avoid that impasse earlier?",
          "How did that experience influence your ongoing relationship with that engineering lead?"
        ]
      },
      {
        id: "bh_2",
        prompt: "Describe a project you led that ultimately failed to meet its target metrics. What happened and what did you learn?",
        context: "Focus on accountability, root cause analysis, and how you communicated the retrospective to leadership.",
        followUps: [
          "What were the leading indicators you missed before the launch date?",
          "How did you manage team morale when the launch fell short of expectations?"
        ]
      }
    ]
  },
  product_strategy: {
    title: "Product Strategy & Metrics",
    description: "Evaluates business acumen, competitive moat, monetization, and North Star metrics.",
    questions: [
      {
        id: "ps_1",
        prompt: "Should Spotify launch a dedicated physical smart display or hardware device for children and families?",
        context: "Evaluate market opportunity, Spotify's core competencies, unit economics, and strategic risks.",
        followUps: [
          "Spotify has historically struggled with hardware margins. Why hardware instead of a software-only partner ecosystem?",
          "How does this move defend against Apple Music and Amazon Prime Music in household ecosystems?",
          "If this device cannibalizes standard mobile family subscriptions, how do you justify the CapEx to the board?"
        ]
      },
      {
        id: "ps_2",
        prompt: "Uber is considering offering 15-minute ultra-fast grocery delivery in tier-1 cities. Would you recommend greenlighting this?",
        context: "Evaluate operational unit economics, rider cannibalization, dark store logistics, and competitive moat.",
        followUps: [
          "What is your customer acquisition cost (CAC) vs. LTV assumption for 15-minute delivery?",
          "How would you run a rapid MVP test in one pilot market before investing in dark store real estate?"
        ]
      }
    ]
  }
};

// API: Get Tracks & Questions
app.get("/api/tracks", (req, res) => {
  res.json({ success: true, tracks: INTERVIEW_TRACKS });
});

// API: Evaluate User Turn & Generate Follow-Up / Avatar Reaction
app.post("/api/evaluate-turn", (req, res) => {
  const { trackId, questionId, turnIndex, userResponse, history } = req.body;

  const track = INTERVIEW_TRACKS[trackId] || INTERVIEW_TRACKS["product_design"];
  const question = track.questions.find(q => q.id === questionId) || track.questions[0];

  const wordCount = (userResponse || "").trim().split(/\s+/).length;
  const lower = (userResponse || "").toLowerCase();

  // Framework detection
  const hasStructure = lower.includes("first") || lower.includes("second") || lower.includes("structure") || lower.includes("segment") || lower.includes("situation") || lower.includes("goal") || lower.includes("user");
  const hasMetrics = lower.includes("metric") || lower.includes("measure") || lower.includes("retention") || lower.includes("dau") || lower.includes("conversion") || lower.includes("throughput");
  const hasEmpathy = lower.includes("user") || lower.includes("pain point") || lower.includes("anxiety") || lower.includes("struggle") || lower.includes("need");

  // Determine avatar reaction & micro-feedback
  let avatarState = "nodding"; // nodding, challenging, thinking, satisfied
  let coachNote = "";

  if (wordCount < 25) {
    avatarState = "challenging";
    coachNote = "A bit brief! In PM interviews, aim to unpack your reasoning and state your structured assumptions clearly.";
  } else if (hasStructure && (hasEmpathy || hasMetrics)) {
    avatarState = "satisfied";
    coachNote = "Great structural framing! You identified key user segments and articulated constraints early.";
  } else if (!hasStructure) {
    avatarState = "nodding";
    coachNote = "Good points, but consider framing your answer with an explicit 3-part roadmap (e.g. 'I will cover Goals, User Personas, and Solutions').";
  } else {
    avatarState = "thinking";
    coachNote = "Strong depth. Notice how Alex takes notes and pauses to evaluate your trade-offs.";
  }

  // Pick or synthesize follow-up question
  let nextInterviewerSpeech = "";
  const isFinalTurn = turnIndex >= 2;

  if (isFinalTurn) {
    nextInterviewerSpeech = "Thank you for walking me through that. You've given a solid overview. Let's wrap up this case here so I can provide your detailed diagnostic scorecard.";
  } else {
    const defaultFollowUp = question.followUps[turnIndex] || question.followUps[0];
    if (wordCount < 25) {
      nextInterviewerSpeech = `Could you double-click into that? ${defaultFollowUp}`;
    } else {
      const acknowledgements = [
        "Makes sense. Let's pressure-test that assumption. ",
        "I like the user-centric lens you took there. To dig deeper: ",
        "Understood. If we look at the operational trade-offs: "
      ];
      const prefix = acknowledgements[turnIndex % acknowledgements.length];
      nextInterviewerSpeech = prefix + defaultFollowUp;
    }
  }

  res.json({
    success: true,
    avatarState,
    coachNote,
    isFinalTurn,
    nextInterviewerSpeech,
    turnScore: Math.min(95, Math.max(65, 70 + (hasStructure ? 10 : 0) + (hasMetrics ? 8 : 0) + (hasEmpathy ? 7 : 0)))
  });
});

// API: Generate Final Diagnostic Scorecard
app.post("/api/generate-scorecard", (req, res) => {
  const { trackId, questionId, durationSeconds, transcript, preConfidence, postConfidence } = req.body;

  const totalWords = (transcript || []).reduce((acc, t) => acc + (t.speaker === "user" ? t.text.split(/\s+/).length : 0), 0);
  const userTurns = (transcript || []).filter(t => t.speaker === "user");

  // Analyze rubrics
  const textCorpus = userTurns.map(t => t.text.toLowerCase()).join(" ");

  const hasFramework = textCorpus.includes("goal") || textCorpus.includes("first") || textCorpus.includes("user") || textCorpus.includes("situation");
  const hasTradeoffs = textCorpus.includes("trade-off") || textCorpus.includes("risk") || textCorpus.includes("however") || textCorpus.includes("alternative");
  const hasMetrics = textCorpus.includes("metric") || textCorpus.includes("measure") || textCorpus.includes("north star") || textCorpus.includes("conversion") || textCorpus.includes("retention");
  const hasPrioritization = textCorpus.includes("prioritize") || textCorpus.includes("impact") || textCorpus.includes("effort") || textCorpus.includes("p0");

  const structureScore = hasFramework ? Math.floor(85 + Math.random() * 10) : Math.floor(70 + Math.random() * 10);
  const empathyScore = textCorpus.includes("user") || textCorpus.includes("need") ? Math.floor(82 + Math.random() * 12) : 72;
  const metricsScore = hasMetrics ? Math.floor(88 + Math.random() * 8) : Math.floor(65 + Math.random() * 10);
  const deliveryScore = totalWords > 120 ? Math.floor(84 + Math.random() * 10) : 74;

  const overallScore = Math.round((structureScore * 0.35) + (empathyScore * 0.25) + (metricsScore * 0.2) + (deliveryScore * 0.2));

  const strengths = [];
  const improvements = [];

  if (hasFramework) strengths.push("Structured communication with clear categorization.");
  else improvements.push("State your framework upfront (e.g. CIRCLES or STAR) before detailing solutions.");

  if (hasTradeoffs) strengths.push("Proactively addressed business & technical trade-offs.");
  else improvements.push("Highlight trade-offs and edge cases explicitly to showcase senior product judgment.");

  if (hasMetrics) strengths.push("Defined actionable primary and secondary success metrics.");
  else improvements.push("Tie your recommendations back to measurable business outcomes (North Star & guardrail metrics).");

  if (totalWords < 150) {
    improvements.push("Elaborate on your user persona segmentation; your answers were slightly concise.");
  } else {
    strengths.push("Good depth and confident conversational pacing.");
  }

  const scorecard = {
    overallScore,
    percentile: Math.min(96, Math.max(68, overallScore + 4)),
    rubrics: {
      structure: { score: structureScore, label: "Structure & Framework", benchmark: "80% (Senior Bar)" },
      userEmpathy: { score: empathyScore, label: "User Empathy & Needs", benchmark: "75% (Target Bar)" },
      metricsThinking: { score: metricsScore, label: "Metrics & Business Impact", benchmark: "70% (Target Bar)" },
      vocalDelivery: { score: deliveryScore, label: "Vocal Clarity & Presence", benchmark: "80% (Senior Bar)" }
    },
    strengths,
    improvements,
    confidenceDelta: (postConfidence || 4) - (preConfidence || 2),
    timestamp: new Date().toISOString()
  };

  // Log session to DB
  const db = readDb();
  db.sessions.unshift({
    id: `sess_${Date.now()}`,
    track: trackId,
    questionId,
    durationSeconds,
    turns: userTurns.length,
    preConfidence: preConfidence || 2,
    postConfidence: postConfidence || 4,
    overallScore,
    timestamp: new Date().toISOString()
  });
  writeDb(db);

  res.json({ success: true, scorecard });
});

// API: Save User Feedback
app.post("/api/telemetry/feedback", (req, res) => {
  const { rating, comment, role } = req.body;
  const db = readDb();
  const entry = {
    id: `fb_${Date.now()}`,
    rating: Number(rating) || 5,
    comment: comment || "",
    role: role || "Applicant",
    timestamp: new Date().toISOString()
  };
  db.feedbacks.unshift(entry);
  writeDb(db);
  res.json({ success: true, entry });
});

// API: Save Waitlist
app.post("/api/telemetry/waitlist", (req, res) => {
  const { email, targetCompany, role } = req.body;
  const db = readDb();
  const entry = {
    id: `wl_${Date.now()}`,
    email: email || "",
    targetCompany: targetCompany || "Google PM",
    role: role || "Student",
    timestamp: new Date().toISOString()
  };
  db.waitlist.unshift(entry);
  writeDb(db);
  res.json({ success: true, entry });
});

// API: Live Telemetry & Analytics Overview
app.get("/api/telemetry/stats", (req, res) => {
  const db = readDb();
  const totalSessions = db.sessions.length;
  const avgDuration = totalSessions > 0 ? Math.round(db.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / totalSessions) : 0;
  const avgScore = totalSessions > 0 ? Math.round(db.sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalSessions) : 0;
  const avgRating = db.feedbacks.length > 0 ? (db.feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / db.feedbacks.length).toFixed(1) : "5.0";
  const confidenceGains = db.sessions.filter(s => s.postConfidence && s.preConfidence);
  const avgConfidenceGain = confidenceGains.length > 0 ? (confidenceGains.reduce((acc, s) => acc + (s.postConfidence - s.preConfidence), 0) / confidenceGains.length).toFixed(1) : "+2.1";

  res.json({
    success: true,
    stats: {
      totalSessions,
      avgDurationSeconds: avgDuration,
      avgScore,
      avgRating,
      avgConfidenceGain,
      waitlistCount: db.waitlist.length,
      feedbackCount: db.feedbacks.length,
      recentSessions: db.sessions.slice(0, 10),
      recentFeedback: db.feedbacks.slice(0, 10),
      recentWaitlist: db.waitlist.slice(0, 10)
    }
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CaseMock AI is running live at http://localhost:${PORT}`);
  console.log(`📊 Slide Deck available at http://localhost:${PORT}/slides.html`);
  console.log(`====================================================`);
});
