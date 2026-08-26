const characterMeta = {
  "Nimri Wizzlefen": { group: "dawnrunner", image: "images/portraits/nimri-wizzlefen.webp", label: "Dawnrunner passenger" },
  "Garran Thorne": { group: "dawnrunner", image: "images/portraits/garran-thorne.webp", label: "Dawnrunner passenger" },
  "Brother Odran Vale": { group: "dawnrunner", image: "images/portraits/brother-odran-vale.webp", label: "Dawnrunner passenger" },
  "Silas Kett": { group: "dawnrunner", image: "images/portraits/silas-kett.webp", label: "Dawnrunner passenger" },
  "Bran Mesk": { group: "dawnrunner", image: "images/portraits/bran-mesk.webp", label: "Dawnrunner passenger" },
  "Tella Mesk": { group: "dawnrunner", image: "images/portraits/tella-mesk.webp", label: "Dawnrunner passenger" },
  "Idella": { group: "gryphon", image: "images/portraits/idella.png", label: "Bard for hire at the Laughing Gryphon" },
  "Bram Caskwell": { group: "gryphon", image: "images/portraits/bram-caskwell.webp", label: "Owner of the Laughing Gryphon" }
};

const safeText = value => String(value).replace(/[&<>]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]));

const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const renderMarkdown = markdown => markdown.split("\n\n").map(block => {
  const text = safeText(block.trim());
  if (text.startsWith("# ")) return `<h3 class="record-title">${text.slice(2)}</h3>`;
  if (text.startsWith("## ")) return `<h4 class="record-question">${text.slice(3)}</h4>`;
  if (text.startsWith("*") && text.endsWith("*")) return `<p class="record-intro"><em>${text.slice(1, -1)}</em></p>`;
  return `<p class="record-answer">${text.replace(/\n/g, "<br>")}</p>`;
}).join("");

const rosterGrid = document.querySelector("#roster-grid");
const transcriptList = document.querySelector("#transcript-list");

function renderRoster(filter = "all") {
  rosterGrid.innerHTML = fullInterrogations
    .filter(record => filter === "all" || characterMeta[record.name].group === filter)
    .map(record => {
      const meta = characterMeta[record.name];
      return `<a class="person-card" href="#${slugify(record.name)}">
        <div class="portrait-wrap"><img src="${meta.image}" alt="Portrait of ${safeText(record.name)}"><span class="pin ${meta.group}"></span></div>
        <div class="card-copy"><p class="card-group">${meta.group === "gryphon" ? "LAUGHING GRYPHON" : "DAWNRUNNER"}</p><h3>${safeText(record.name)}</h3><p class="role">${safeText(meta.label)}</p><span class="open-record">Read full text <b>↓</b></span></div>
      </a>`;
    }).join("");
}

transcriptList.innerHTML = fullInterrogations.map((record, index) => `<details class="transcript" id="${slugify(record.name)}" ${index === 0 ? "open" : ""}>
  <summary><span class="transcript-count">${String(index + 1).padStart(2, "0")}</span><span><b>${safeText(record.name)}</b><small>Complete text from ${safeText(record.name)}.md</small></span><i>+</i></summary>
  <div class="transcript-body">${renderMarkdown(record.markdown)}</div>
</details>`).join("");

renderRoster();

document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(item => item.classList.remove("is-active"));
  button.classList.add("is-active");
  renderRoster(button.dataset.filter);
}));

document.addEventListener("click", event => {
  const card = event.target.closest(".person-card");
  if (!card) return;
  const record = document.querySelector(card.getAttribute("href"));
  if (record) record.open = true;
});
