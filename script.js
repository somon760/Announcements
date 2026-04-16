const notePanel = document.querySelector("[data-note-panel]");

if (notePanel) {
  const noteTitle = notePanel.querySelector("[data-note-title]");
  const noteCopy = notePanel.querySelector("[data-note-copy]");
  const buttons = Array.from(document.querySelectorAll(".map-hotspot"));
  const definitions = new Map(
    Array.from(document.querySelectorAll("[data-note-definition]")).map((definition) => [
      definition.dataset.noteDefinition,
      definition,
    ])
  );

  const selectNote = (noteKey) => {
    const definition = definitions.get(noteKey);

    if (!definition || !noteTitle || !noteCopy) {
      return;
    }

    noteTitle.textContent = definition.dataset.title || "Pinned Scrap";
    noteCopy.innerHTML = definition.innerHTML;

    buttons.forEach((button) => {
      const isActive = button.dataset.note === noteKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (window.matchMedia("(max-width: 980px)").matches) {
      notePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      selectNote(button.dataset.note || "");
    });
  });

  const defaultButton = buttons.find((button) => button.dataset.default === "true") || buttons[0];

  if (defaultButton) {
    selectNote(defaultButton.dataset.note || "");
  }
}