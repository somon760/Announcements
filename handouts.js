const handoutNavList = document.querySelector("[data-handout-nav-list]");

if (handoutNavList) {
  const handoutStatus = document.querySelector("[data-handout-status]");
  const handoutCount = document.querySelector("[data-handout-count]");
  const handoutUpdated = document.querySelector("[data-handout-updated]");
  const handoutSource = document.querySelector("[data-handout-source]");
  const handoutTitle = document.querySelector("[data-handout-title]");
  const handoutImage = document.querySelector("[data-handout-image]");
  const handoutImageCaption = document.querySelector("[data-handout-image-caption]");
  const handoutContent = document.querySelector("[data-handout-content]");
  const handoutJournalLink = document.querySelector("[data-handout-journal-link]");
  const prevButton = document.querySelector("[data-handout-prev]");
  const nextButton = document.querySelector("[data-handout-next]");

  let handouts = [];
  let activeIndex = -1;

  const setStatus = (message, isError = false) => {
    if (!handoutStatus) {
      return;
    }

    handoutStatus.textContent = message;
    handoutStatus.classList.toggle("is-error", isError);
  };

  const formatTimestamp = (value) => {
    if (!value) {
      return "unknown";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toLocaleString();
  };

  const toParagraphs = (value) => {
    if (!value) {
      return [];
    }

    return String(value)
      .split(/\n\s*\n/g)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  };

  const updateControlState = () => {
    const hasItems = handouts.length > 0;

    if (prevButton) {
      prevButton.disabled = !hasItems;
    }

    if (nextButton) {
      nextButton.disabled = !hasItems;
    }
  };

  const markActiveButton = () => {
    const buttons = Array.from(handoutNavList.querySelectorAll(".handout-nav-button"));

    buttons.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const selectHandout = (index, { updateHash = true } = {}) => {
    if (index < 0 || index >= handouts.length) {
      return;
    }

    const handout = handouts[index];
    activeIndex = index;

    if (handoutTitle) {
      handoutTitle.textContent = handout.title || "Untitled Handout";
    }

    if (handoutImage) {
      handoutImage.src = handout.image || "";
      handoutImage.alt = handout.title ? handout.title + " handout image" : "Handout image";
    }

    if (handoutImageCaption) {
      handoutImageCaption.textContent = handout.title || "";
    }

    if (handoutJournalLink) {
      handoutJournalLink.href = handout.journalUrl || "#";
      handoutJournalLink.textContent = handout.journalUrl ? "open in Roll20" : "source unavailable";
    }

    if (handoutContent) {
      const paragraphs = toParagraphs(handout.contentText);
      handoutContent.replaceChildren();

      if (paragraphs.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No text was captured for this handout.";
        handoutContent.append(empty);
      } else {
        paragraphs.forEach((paragraph) => {
          const node = document.createElement("p");
          node.textContent = paragraph;
          handoutContent.append(node);
        });
      }
    }

    markActiveButton();

    if (updateHash && handout.slug) {
      history.replaceState(null, "", "#" + handout.slug);
    }
  };

  const selectByHash = () => {
    if (handouts.length === 0) {
      return;
    }

    const hash = window.location.hash.replace(/^#/, "").trim();

    if (!hash) {
      selectHandout(0, { updateHash: false });
      return;
    }

    const foundIndex = handouts.findIndex((entry) => entry.slug === hash);

    if (foundIndex >= 0) {
      selectHandout(foundIndex, { updateHash: false });
      return;
    }

    selectHandout(0, { updateHash: false });
  };

  const renderNav = () => {
    handoutNavList.replaceChildren();

    handouts.forEach((handout, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");

      button.type = "button";
      button.className = "handout-nav-button";
      button.textContent = handout.title || "Untitled Handout";
      button.addEventListener("click", () => {
        selectHandout(index);
      });

      item.append(button);
      handoutNavList.append(item);
    });

    updateControlState();
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (handouts.length === 0) {
        return;
      }

      const nextIndex = activeIndex <= 0 ? handouts.length - 1 : activeIndex - 1;
      selectHandout(nextIndex);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (handouts.length === 0) {
        return;
      }

      const nextIndex = activeIndex >= handouts.length - 1 ? 0 : activeIndex + 1;
      selectHandout(nextIndex);
    });
  }

  window.addEventListener("hashchange", () => {
    selectByHash();
  });

  fetch("handouts.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Could not load handouts.json");
      }

      return response.json();
    })
    .then((payload) => {
      handouts = Array.isArray(payload?.handouts) ? payload.handouts : [];

      if (handoutCount) {
        handoutCount.textContent = String(handouts.length);
      }

      if (handoutUpdated) {
        handoutUpdated.textContent = formatTimestamp(payload?.exportedAt);
      }

      if (handoutSource && payload?.source?.url) {
        handoutSource.href = payload.source.url;
      }

      if (handoutSource && payload?.source?.label) {
        handoutSource.textContent = payload.source.label;
      }

      if (handouts.length === 0) {
        setStatus("No handouts are available in handouts.json.", true);
        updateControlState();
        return;
      }

      renderNav();
      selectByHash();
      setStatus("Loaded " + handouts.length + " imported handouts.");
    })
    .catch((error) => {
      console.error(error);
      setStatus("Failed to load handouts.json. Serve the site over HTTP and confirm the JSON is valid.", true);
      updateControlState();
    });
}
