const safeText = value => String(value ?? "").replace(/[&<>\"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const initials = name => name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
const topicCount = record => record.topics.length;
const wagonImages = {
  Black: "images/wagons/black.webp",
  Copper: "images/wagons/copper.webp",
  Golden: "images/wagons/golden.webp",
  Green: "images/wagons/green.webp",
  Player: "images/wagons/player.webp",
  Purple: "images/wagons/purple.webp",
  Red: "images/wagons/red.webp",
  Yellow: "images/wagons/yellow.webp"
};
const npcImages = {
  "Aelthir Voss": "images/npcs/aelthir-voss.webp",
  "Anwen Rusk": "images/npcs/anwen-rusk.webp",
  "Berra Stonehand": "images/npcs/berra-stonehand.webp",
  "Brakka Bluehand": "images/npcs/brakka-bluehand.webp",
  "Calistra Vey": "images/npcs/calistra-vey.webp",
  "Darrik Vane": "images/npcs/darrik-vane.webp",
  "Dornan Goldthread": "images/npcs/dornan-goldthread.webp",
  "Elaria Silverbough": "images/npcs/elaria-silverbough.webp",
  "Hessan Grimhorn": "images/npcs/hessan-grimhorn.webp",
  "Hesta Rowan": "images/npcs/hesta-rowan.webp",
  "Ilyra Coastwind": "images/npcs/ilyra-coastwind.webp",
  "Joram Pell": "images/npcs/joram-pell.webp",
  "Liora Vale": "images/npcs/liora-vale.webp",
  "Mara Fen": "images/npcs/mara-fen.webp",
  "Merrik Sable": "images/npcs/merrik-sable.webp",
  "Milo Tumblewheel": "images/npcs/milo-tumblewheel.webp",
  "Nessa Copperkettle": "images/npcs/nessa-copperkettle.webp",
  "Nyxara Duskfall": "images/npcs/nyxara-duskfall.webp",
  "Othyr Embercrest": "images/npcs/othyr-embercrest.webp",
  "Pippin Dapple": "images/npcs/pippin-dapple.webp",
  "Sava Merrin": "images/npcs/sava-merrin.webp",
  "Seris Thornwake": "images/npcs/seris-thornwake.webp",
  "Thalan Greenbranch": "images/npcs/thalan-greenbranch.webp",
  "Torren Stonefall": "images/npcs/torren-stonefall.webp",
  "Tovin Bramblelock": "images/npcs/tovin-bramblelock.webp",
  "Varkesh Ashscale": "images/npcs/varkesh-ashscale.webp",
  "Veyra Ashveil": "images/npcs/veyra-ashveil.webp",
  "Zafir Kestrel": "images/npcs/zafir-kestrel.webp"
};

const wagonByName = {
  "Aelthir Voss": ["Green", "driver", "lead merchant wagon", 1], "Dornan Goldthread": ["Green", "merchant", "lead merchant wagon", 1], "Berra Stonehand": ["Green", "cargo hand", "lead merchant wagon", 1], "Ilyra Coastwind": ["Green", "traveler", "lead merchant wagon", 1], "Joram Pell": ["Green", "scribe", "lead merchant wagon", 1],
  "Calistra Vey": ["Red", "teamster", "cult wagon", 2], "Merrik Sable": ["Red", "guard", "cult wagon", 2],
  "Brakka Bluehand": ["Yellow", "driver", "merchant wagon", 3], "Elaria Silverbough": ["Yellow", "merchant", "merchant wagon", 3], "Mara Fen": ["Yellow", "traveler", "merchant wagon", 3], "Nessa Copperkettle": ["Yellow", "cook", "merchant wagon", 3],
  "Anwen Rusk": ["Player", "driver", "player wagon", 4],
  "Hessan Grimhorn": ["Golden", "teamster", "cult wagon", 5], "Varkesh Ashscale": ["Golden", "guard", "cult wagon", 5],
  "Hesta Rowan": ["Purple", "driver", "merchant wagon", 6], "Tovin Bramblelock": ["Purple", "traveler", "merchant wagon", 6], "Othyr Embercrest": ["Purple", "traveler", "merchant wagon", 6], "Pippin Dapple": ["Purple", "traveler", "merchant wagon", 6], "Thalan Greenbranch": ["Purple", "traveler", "merchant wagon", 6],
  "Darrik Vane": ["Black", "teamster", "cult wagon", 7], "Seris Thornwake": ["Black", "guard", "cult wagon", 7],
  "Milo Tumblewheel": ["Copper", "driver", "rear merchant wagon", 8], "Zafir Kestrel": ["Copper", "traveler", "rear merchant wagon", 8], "Veyra Ashveil": ["Copper", "traveler", "rear merchant wagon", 8], "Liora Vale": ["Copper", "traveler", "rear merchant wagon", 8], "Nyxara Duskfall": ["Copper", "traveler", "rear merchant wagon", 8], "Sava Merrin": ["Copper", "traveler", "rear merchant wagon", 8], "Torren Stonefall": ["Copper", "guard", "rear merchant wagon", 8]
};

const rosterGrid = document.querySelector("#roster-grid");
const transcriptList = document.querySelector("#transcript-list");
const voteGrid = document.querySelector("#vote-grid");
const voteStatus = document.querySelector("#vote-status");
const conversationDialog = document.querySelector("#conversation-dialog");
const conversationContent = document.querySelector("#conversation-content");
const voteWagons = ["Green", "Red", "Yellow", "Golden", "Purple", "Black", "Copper"];
const fallbackTally = Object.fromEntries(voteWagons.map(wagon => [wagon, 0]));
let voteTally = { ...fallbackTally };
const recordWagon = record => wagonByName[record.name] || ["Unassigned", "caravan NPC", "caravan", 99];
const renderPortrait = (record, wagon) => npcImages[record.name]
  ? `<div class="portrait-wrap npc-portrait"><img src="${npcImages[record.name]}" alt="${safeText(record.name)}"><span>${safeText(wagon)} Wagon</span></div>`
  : wagonImages[wagon]
    ? `<div class="portrait-wrap wagon-portrait"><img src="${wagonImages[wagon]}" alt="${safeText(wagon)} Wagon"><span>${safeText(initials(record.name))}</span><i></i></div>`
  : `<div class="portrait-wrap monogram-portrait" aria-hidden="true"><span>${safeText(initials(record.name))}</span><i></i></div>`;

function renderRoster(filter = "all") {
  const records = caravanConversations.filter(record => filter === "all" || recordWagon(record)[0] === filter);
  rosterGrid.innerHTML = records.map(record => {
    const [wagon, role, description] = recordWagon(record);
    return `<button type="button" class="person-card" data-name="${safeText(record.name)}">${renderPortrait(record, wagon)}<div class="card-copy"><p class="card-group">${safeText(wagon)} WAGON</p><h3>${safeText(record.name)}</h3><p class="role">${safeText(role)}</p><p class="tone">${safeText(description)}</p><span class="open-record">Open conversation record <b>↓</b></span></div></button>`;
  }).join("");
  rosterGrid.querySelectorAll(".person-card").forEach(card => card.addEventListener("click", () => openConversation(card.dataset.name)));
}

function renderConversation(record) {
  const [wagon, role, description] = recordWagon(record);
  const topics = record.topics.map((topic, index) => `<article class="conversation-topic"><p class="topic-number">${String(index + 1).padStart(2, "0")} · ${safeText(topic.label || topic.id)}</p><p class="topic-prompt">${safeText(topic.prompt)}</p><p class="topic-answer">${safeText(topic.answer)}</p></article>`).join("");
  const notes = [["Conversation close", record.quitMessage], ["Context fallback", record.contextFallbackMessage], ["Fallback", record.fallbackMessage]].filter(([, value]) => value).map(([label, value]) => `<p class="conversation-note"><b>${label}</b>${safeText(value)}</p>`).join("");
  return `<p class="record-kicker">${safeText(wagon)} WAGON · ${safeText(role)} · MARCHING POSITION ${recordWagon(record)[3]}</p><h3 class="conversation-title">${safeText(record.name)}</h3><p class="record-intro">${safeText(description)}. Wagon placement is indexed here; conversation text is extracted from the current <em>On The Road</em> Director file.</p><div class="conversation-topics">${topics}</div>${notes ? `<div class="conversation-notes">${notes}</div>` : ""}`;
}

function openConversation(name) {
  const record = caravanConversations.find(item => item.name === name);
  if (!record) return;
  conversationContent.innerHTML = renderConversation(record);
  conversationDialog.hidden = false;
  document.body.classList.add("modal-open");
  conversationDialog.querySelector(".close").focus();
}

function closeConversation() {
  conversationDialog.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderVoteTally() {
  const totalVotes = voteWagons.reduce((sum, wagon) => sum + voteTally[wagon], 0);
  voteGrid.innerHTML = voteWagons.map(wagon => {
    const votes = voteTally[wagon];
    const full = votes >= 4;
    return `<article class="vote-card"><div class="vote-card-head"><div><p class="vote-wagon-label">${safeText(wagon)} WAGON</p><h3>${votes}<span>/4</span></h3></div><span class="vote-count-label">${votes === 1 ? "1 vote" : `${votes} votes`}</span></div><div class="vote-meter" aria-hidden="true"><span style="width:${votes * 25}%"></span></div><button type="button" class="vote-button" data-vote-wagon="${safeText(wagon)}" ${full ? "disabled" : ""}>${full ? "Vote limit reached" : `Vote ${safeText(wagon)} wagon`}</button></article>`;
  }).join("");
  voteStatus.textContent = totalVotes ? `${totalVotes} party ${totalVotes === 1 ? "vote" : "votes"} recorded. Each wagon tops out at four.` : "No votes recorded yet. Which wagons look suspicious?";
  voteGrid.querySelectorAll("[data-vote-wagon]").forEach(button => button.addEventListener("click", () => castVote(button.dataset.voteWagon, button)));
}

async function loadVoteTally() {
  try {
    const response = await fetch("api/cult-vote", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Vote tally unavailable");
    const data = await response.json();
    voteTally = { ...fallbackTally, ...data.wagons };
  } catch {
    voteTally = { ...fallbackTally };
    voteStatus.textContent = "The party tally is unavailable right now. You can still review the caravan records.";
  }
  renderVoteTally();
}

async function castVote(wagon, button) {
  button.disabled = true;
  try {
    const response = await fetch("api/cult-vote", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ wagon }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Vote unavailable");
    voteTally = { ...fallbackTally, ...data.wagons };
    renderVoteTally();
  } catch {
    button.disabled = false;
    voteStatus.textContent = "That vote could not be recorded. Try again in a moment.";
  }
}

transcriptList.innerHTML = caravanConversations.map((record, index) => `<details class="transcript" id="${slugify(record.name)}" ${index === 0 ? "open" : ""}><summary><span class="transcript-count">${String(index + 1).padStart(2, "0")}</span><span><b>${safeText(record.name)}</b><small>${safeText(recordWagon(record)[0])} wagon · Director conversation record</small></span><i>+</i></summary><div class="transcript-body">${renderConversation(record)}</div></details>`).join("");

renderRoster();
renderVoteTally();
loadVoteTally();
document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".filter").forEach(item => item.classList.remove("is-active")); button.classList.add("is-active"); renderRoster(button.dataset.filter); }));
conversationDialog.querySelector(".close").addEventListener("click", closeConversation);
conversationDialog.addEventListener("click", event => { if (event.target === conversationDialog) closeConversation(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !conversationDialog.hidden) closeConversation(); });
