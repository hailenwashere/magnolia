// === View Switching ===
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  if (viewId === "view-fiber") {
    document.getElementById("tab-fiber").classList.add("active");
  } else {
    document.getElementById("tab-details").classList.add("active");
  }
}

// === Hover Note Logic ===
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function attachHoverNotes() {
  const noteBox = document.getElementById("hover-note");
  const noteTitle = document.getElementById("hover-note-title");
  const noteBody = document.getElementById("hover-note-body");
  const hoverables = document.querySelectorAll(".has-note");

  hoverables.forEach(el => {
    el.addEventListener("mouseenter", () => {
      noteTitle.textContent = el.dataset.noteTitle || "";
      noteBody.textContent = el.dataset.noteBody || "";

      const rect = el.getBoundingClientRect();
      const popupWidth = window.innerWidth;
      const popupHeight = window.innerHeight;

      const noteWidth = noteBox.offsetWidth || 260;
      const noteHeight = noteBox.offsetHeight || 120;

      let left = rect.left + rect.width / 2 - noteWidth / 2;
      let top = rect.top - noteHeight - 12;

      left = clamp(left, 8, popupWidth - noteWidth - 8);
      top = clamp(top, 8, popupHeight - noteHeight - 8);

      noteBox.style.left = left + "px";
      noteBox.style.top = top + "px";

      noteBox.classList.add("visible");
    });

    el.addEventListener("mouseleave", () => {
      noteBox.classList.remove("visible");
    });
  });
}

// ========= DETAILS VIEW RENDERING =========

// Utility to render ★★★★★ from numeric rating
function starsForRating(rating) {
  const full = Math.round(rating); // simple
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += i < full ? "★" : "☆";
  }
  return out;
}

/**
 * Renders the Details view.
 * Later, you'll call this with data returned from background/OpenAI.
 *
 * details = {
 *   rating: number,
 *   reviewCount: number,
 *   summaryNotes: string[],   // 2–4 bullet points
 *   bestFor: string[],        // chips
 *   avoidIf: string[]         // chips
 * }
 */
function renderDetails(details) {
  const {
    rating = 4.3,
    reviewCount = 1200,
    summaryNotes = [],
    bestFor = [],
    avoidIf = []
  } = details || {};

  const ratingEl = document.getElementById("summary-rating");
  const starsEl = document.getElementById("summary-stars");
  const countEl = document.getElementById("summary-review-count");
  const listEl = document.getElementById("summary-list");
  const bestRow = document.getElementById("best-for-chips");
  const avoidRow = document.getElementById("avoid-if-chips");

  if (!ratingEl || !starsEl || !countEl || !listEl || !bestRow || !avoidRow) return;

  ratingEl.textContent = rating.toFixed(1);
  starsEl.textContent = starsForRating(rating);
  countEl.textContent =
    reviewCount >= 1000
      ? `${(reviewCount / 1000).toFixed(1)}k reviews`
      : `${reviewCount} reviews`;

  // Summary bullets
  listEl.innerHTML = "";
  summaryNotes.forEach(text => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="summary-bullet">✓</span><span>${text}</span>`;
    listEl.appendChild(li);
  });

  // Helper for chip rows
  function fillChips(container, items) {
    container.innerHTML = "";
    items.forEach(label => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = label;
      container.appendChild(chip);
    });
  }

  fillChips(bestRow, bestFor);
  fillChips(avoidRow, avoidIf);
}

// Demo placeholder so the UI looks like your mock until backend is wired
const demoDetailsData = {
  rating: 4.3,
  reviewCount: 1200,
  summaryNotes: [
    "Super comfortable for all-day wear",
    "True to size with flattering fit",
    "Some reports of pilling",
    "Might wrinkle easily"
  ],
  bestFor: ["Daily wear", "Travel", "Layering"],
  avoidIf: ["Low-maintenance needed", "Wrinkle-free required"]
};

// ========= MATERIALS SECTION (existing logic) =========

function getMajorityFiber(materials) {
  if (!materials || !materials.length) return null;

  let majority = materials[0];
  for (const mat of materials) {
    if (mat.percent > majority.percent) {
      majority = mat;
    }
  }
  return majority.name;
}

const plantIcons = ["🌿", "🍃", "🌱", "🌾", "🍀"];

// == Materials Bar Rendering ==
function updateFiberFromMaterials(materials, notes) {
  const bar = document.querySelector(".composition-bar");
  const legend = document.querySelector(".composition-legend");
  if (!bar || !legend || !materials || !materials.length) {
    return;
  }

  bar.innerHTML = "";
  legend.innerHTML = "";

  const maxSegments = 5;
  materials.slice(0, maxSegments).forEach((mat, index) => {
    const segIndex = index + 1;

    const seg = document.createElement("div");
    seg.className = `seg seg-${segIndex}`;
    seg.style.width = `${mat.percent}%`;
    bar.appendChild(seg);

    const item = document.createElement("div");
    item.className = "legend-item has-note";

    const materialName = mat.name.replace(/\b\w/g, char => char.toUpperCase());
    item.dataset.noteTitle = `${plantIcons[index]} ${materialName}`;
    item.dataset.noteBody = notes && notes[mat.name]
      ? notes[mat.name].environmental_impact_desc
      : `${mat.percent}% ${materialName}`;

    item.innerHTML = `
      <span class="legend-dot dot-${segIndex}"></span>
      <span class="legend-label">${materialName}</span>
      <span class="legend-percent">${mat.percent}%</span>
    `;

    legend.appendChild(item);
  });

  attachHoverNotes();
}

// === Care Section ===
const careIconMap = {
  wash: "💧",
  dry: "🌬️",
  avoid: "❌",
  recycle: "♻️",
  recommend: "👍",
  okay: "🤔",
  discouraged: "⚠️",
  unrecyclable: "🚫"
};

function updateCareInstructions(careInstructions, materials) {
  const careContainer = document.querySelector(".care-row");
  if (!careContainer || !careInstructions || !Object.keys(careInstructions).length) {
    return;
  }

  careContainer.innerHTML = "";

  // find majority fibre key in careInstructions using materials array
  let majorityKey = null;
  let maxPercent = -1;
  for (const mat of materials || []) {
    if (careInstructions[mat.name] && mat.percent > maxPercent) {
      majorityKey = mat.name;
      maxPercent = mat.percent;
    }
  }
  const fibreKey = majorityKey || Object.keys(careInstructions)[0];

  for (const [key, value] of Object.entries(careInstructions[fibreKey])) {
    const item = document.createElement("div");
    item.className = value.note ? "care-item has-note" : "care-item";

    item.dataset.noteTitle = key.charAt(0).toUpperCase() + key.slice(1);
    item.dataset.noteBody = value.note || "";

    item.innerHTML = `
      <div class="care-icon ${value.style}">${careIconMap[key] || "ℹ️"}</div>
      <div class="care-label">${value.label}</div>
    `;
    careContainer.appendChild(item);
  }

  attachHoverNotes();
}

// === Durability Section ===
function updateDurabilityScore(durabilityScores, materials) {
  const lifespanScoreEl = document.querySelector(".lifespan-score");
  const lifespanPillEl = document.querySelector(".lifespan-pill");
  if (!lifespanScoreEl || !lifespanPillEl || !durabilityScores || !materials) {
    return;
  }

  let score = 0;
  let highestMat = null;
  let lowestMat = null;

  for (const mat of materials) {
    const matScore = durabilityScores[mat.name] ?? 0;
    score += matScore * (mat.percent / 100);
    if (!highestMat || matScore > (durabilityScores[highestMat.name] ?? 0)) {
      highestMat = mat;
    }
    if (!lowestMat || matScore < (durabilityScores[lowestMat.name] ?? 0)) {
      lowestMat = mat;
    }
  }

  lifespanScoreEl.textContent = score.toFixed(1);

  if (score >= 4) {
    lifespanPillEl.textContent = "Long lasting";
    lifespanPillEl.className = "lifespan-pill pill-long";
  } else if (score >= 2.5) {
    lifespanPillEl.textContent = "Moderate";
    lifespanPillEl.className = "lifespan-pill pill-moderate";
  } else {
    lifespanPillEl.textContent = "Short lifespan";
    lifespanPillEl.className = "lifespan-pill pill-short";
  }
}

// ========= DOM READY (tabs + details demo) =========
document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  document
    .getElementById("tab-fiber")
    .addEventListener("click", () => showView("view-fiber"));
  document
    .getElementById("tab-details")
    .addEventListener("click", () => showView("view-details"));

  attachHoverNotes();

  // For now, render demo data. Later you'll replace this with data
  // returned from your OpenAI/backend call.
  renderDetails(demoDetailsData);
});

// ========= Popup Initialization: materials + brand =========
document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup script loaded: sending message to background to get materials");
  chrome.runtime.sendMessage({ action: "getMaterials" }, function (response) {
    console.log("Response received from background:", response);
    if (!response || !Array.isArray(response.materials)) {
      console.log("No parsed materials received");
      return;
    }

    // Update fiber bar and legend
    updateFiberFromMaterials(response.materials, response.notes);

    chrome.runtime.sendMessage({ action: "getCareInstructions" }, function (careResponse) {
      console.log("Care instructions response received from background:", careResponse);
      if (!careResponse) return;
      // Update care instructions
      updateCareInstructions(careResponse, response.materials);
    });

    chrome.runtime.sendMessage({ action: "getDurabilityScores" }, function (durabilityResponse) {
      console.log("Durability scores response received from background:", durabilityResponse);
      if (!durabilityResponse) return;
      // Update durability score
      updateDurabilityScore(durabilityResponse, response.materials);
    });
  });

  console.log("Getting brand sustainability info");
  chrome.runtime.sendMessage({ action: "getBrandInfo" }, function (brandResponse) {
    console.log("Brand info response received from background:", brandResponse);
    const nameEl = document.getElementById("brand-name");
    const bodyEl = document.getElementById("brand-sustainability-body");

    if (!brandResponse || !nameEl || !bodyEl) {
      console.log("No brand info received");
      return;
    }

    // Populate brand name and sustainability initiatives
    if (brandResponse.name) {
      nameEl.textContent = brandResponse.name;
    }
    if (brandResponse.sustainability_initiatives) {
      bodyEl.textContent = brandResponse.sustainability_initiatives;
    }
  });

  // console.log("Getting item details");
  // chrome.runtime.sendMessage({ action: "getItemDetails" }, function (itemResponse) {
  //   console.log("Item details response received from background:", itemResponse);

  //   if (!itemResponse || !bodyEl) {
  //     console.log("No item details received");
  //     return;
  //   }

  //   // Populate item details
  //   if (itemResponse.details) {
  //     renderDetails(itemResponse.details);
  //   }
  // });
});
