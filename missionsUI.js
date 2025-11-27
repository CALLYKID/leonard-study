/* =====================================================================
   STUDY ADDICT — MISSIONS SYSTEM (CLEAN + COMPATIBLE VERSION)
===================================================================== */

/* ------------------------------------------------------------
   USE missionLocal FROM app.js
------------------------------------------------------------ */
function saveMissionLocal() {
  localStorage.setItem("missionLocal", JSON.stringify(missionLocal));
}

/* ------------------------------------------------------------
   AUTO RESET SYSTEM
------------------------------------------------------------ */
function checkMissionResets() {
  const today = new Date().toDateString();

  // DAILY RESET
  if (missionLocal.lastDaily !== today) {
    missionLocal.dailyMin = 0;
    missionLocal.dailyXP = 0;
    missionLocal.lastDaily = today;

    dailyMissions.forEach(m => {
      m.done = false;
      m.claimed = false;
    });
  }

  // WEEKLY RESET
  const now = new Date();
  const year = now.getFullYear();
  const week = Math.floor((now.getDate() - now.getDay() + 12) / 7);
  const weekID = `${year}-W${week}`;

  if (missionLocal.lastWeekly !== weekID) {
    missionLocal.weeklyMin = 0;
    missionLocal.weeklyXP = 0;
    missionLocal.lastWeekly = weekID;

    weeklyMissions.forEach(m => {
      m.done = false;
      m.claimed = false;
    });
  }

  saveMissionLocal();
}

/* ------------------------------------------------------------
   TRACKING HOOKS (called by app.js)
------------------------------------------------------------ */
function missionTrackMinutes(min) {
  missionLocal.dailyMin += Number(min) || 0;
  missionLocal.weeklyMin += Number(min) || 0;
  saveMissionLocal();
}

function missionTrackXP(x) {
  missionLocal.dailyXP += Number(x) || 0;
  missionLocal.weeklyXP += Number(x) || 0;
  saveMissionLocal();
}

/* ------------------------------------------------------------
   MISSION DEFINITIONS
------------------------------------------------------------ */
const dailyMissions = [
  { id: "d1", title: "Study 20 minutes", need: 20, type: "dailyMin", xp: 80, done: false, claimed: false },
  { id: "d2", title: "Study 1 hour", need: 60, type: "dailyMin", xp: 200, done: false, claimed: false },
  { id: "d3", title: "Earn 150 XP", need: 150, type: "dailyXP", xp: 150, done: false, claimed: false }
];

const weeklyMissions = [
  { id: "w1", title: "Study 3 hours", need: 180, type: "weeklyMin", xp: 350, done: false, claimed: false },
  { id: "w2", title: "Earn 1000 XP", need: 1000, type: "weeklyXP", xp: 500, done: false, claimed: false },
  { id: "w3", title: "7-day streak", need: 7, type: "streak", xp: 800, done: false, claimed: false },
  { id: "w4", title: "Study 6 hours", need: 360, type: "weeklyMin", xp: 1200, done: false, claimed: false }
];

/* ------------------------------------------------------------
   PROGRESS CALCULATOR
------------------------------------------------------------ */
function getMissionProgress(m) {
  let current = 0;

  if (m.type === "dailyMin") current = missionLocal.dailyMin;
  if (m.type === "weeklyMin") current = missionLocal.weeklyMin;
  if (m.type === "dailyXP") current = missionLocal.dailyXP;
  if (m.type === "weeklyXP") current = missionLocal.weeklyXP;
  if (m.type === "streak") current = Number(streak) || 0;

  current = Number(current) || 0;
  const percent = Math.min(100, Math.floor((current / m.need) * 100));

  return { value: current, percent };
}

/* ------------------------------------------------------------
   UPDATE MISSIONS
------------------------------------------------------------ */
function updateMissionProgress() {
  checkMissionResets();

  [...dailyMissions, ...weeklyMissions].forEach(m => {
    const p = getMissionProgress(m);
    if (p.value >= m.need) m.done = true;
  });

  renderMissionsUI();
}

/* ------------------------------------------------------------
   UI RENDER
------------------------------------------------------------ */
function renderMissionsUI() {
  const screen = document.getElementById("missionsScreen");

  let html = `
    <div class="back" onclick="closeScreen('missionsScreen')">BACK</div>
    <h1 class="section-title">DAILY MISSIONS</h1>
    <div class="mission-list">
  `;

  dailyMissions.forEach(m => html += missionCard(m));

  html += `
    </div>
    <h1 class="section-title">WEEKLY MISSIONS</h1>
    <div class="mission-list">
  `;

  weeklyMissions.forEach(m => html += missionCard(m));

  html += `</div>`;

  screen.innerHTML = html;
}

/* ------------------------------------------------------------
   CARD BUILDER
------------------------------------------------------------ */
function missionCard(m) {
  const p = getMissionProgress(m);

  let unit = "units";
  if (m.type.includes("Min")) unit = "min";
  if (m.type.includes("XP")) unit = "XP";
  if (m.type === "streak") unit = "days";

  let claimBtn = "";

  if (m.claimed) claimBtn = `<button class="claim-btn claimed">CLAIMED</button>`;
  else if (m.done) claimBtn = `<button class="claim-btn" onclick="claimMission('${m.id}')">CLAIM</button>`;
  else claimBtn = `<button class="claim-btn locked">...</button>`;

  return `
    <div class="mission-card ${m.done ? "complete" : ""}">
      <div class="mission-info">
        <h2>${m.title}</h2>
        <p>${p.value}/${m.need} ${unit}</p>
        <div class="mission-bar">
          <div class="mission-fill" style="width:${p.percent}%"></div>
        </div>
      </div>
      ${claimBtn}
    </div>
  `;
}

/* ------------------------------------------------------------
   CLAIM
------------------------------------------------------------ */
function claimMission(id) {
  const m =
    dailyMissions.find(x => x.id === id) ||
    weeklyMissions.find(x => x.id === id);

  if (!m) return;
  if (!m.done) return popup("Mission not completed!");
  if (m.claimed) return popup("Already claimed!");

  playSFX("sfxMission");
  m.claimed = true;

  addXP(m.xp);
  missionTrackXP(m.xp);

  spawnMissionXP(id, `+${m.xp} XP`);
  renderMissionsUI();
}

/* ------------------------------------------------------------
   XP POPUP
------------------------------------------------------------ */
function spawnMissionXP(id, text) {
  const btn = document.querySelector(`[onclick="claimMission('${id}')"]`);
  if (!btn) return;

  const card = btn.closest(".mission-card");
  if (!card) return;

  const fx = document.createElement("div");
  fx.className = "mission-xp-pop";
  fx.innerText = text;
  card.appendChild(fx);

  setTimeout(() => fx.remove(), 900);
}

/* ------------------------------------------------------------
   INITIALIZE
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  checkMissionResets();
  renderMissionsUI();
});

/* ------------------------------------------------------------
   DEV RESET
------------------------------------------------------------ */
function devResetMissions() {
  localStorage.removeItem("missionLocal");
  popup("Missions reset");
  missionLocal = {
    dailyMin: 0,
    dailyXP: 0,
    lastDaily: null,
    weeklyMin: 0,
    weeklyXP: 0,
    lastWeekly: null
  };
  updateMissionProgress();
}