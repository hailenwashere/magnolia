// === View Switching ===
function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  if (viewId === "view-fiber") {
    document.getElementById("tab-fiber").classList.add("active");
  } else {
    document.getElementById("tab-reviews").classList.add("active");
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
      // Update text first so width/height are accurate
      noteTitle.textContent = el.dataset.noteTitle || "";
      noteBody.textContent = el.dataset.noteBody || "";

      const rect = el.getBoundingClientRect();
      const popupWidth = window.innerWidth;
      const popupHeight = window.innerHeight;

      // Use actual tooltip size (fallback to defaults if 0)
      const noteWidth = noteBox.offsetWidth || 260;
      const noteHeight = noteBox.offsetHeight || 120;

      // Center over element horizontally, above it vertically
      let left = rect.left + rect.width / 2 - noteWidth / 2;
      let top = rect.top - noteHeight - 12;

      // Clamp so we stay inside the popup window
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


// === Reviews Rendering ===
const reviewMetrics = [
  { name: "Fit", emoji: "👕", value: 87 },
  { name: "Quality", emoji: "💎", value: 78 },
  { name: "Comfort", emoji: "✨", value: 92 },
  { name: "Value", emoji: "💰", value: 64 }
];

const reviewFlags = [
  { name: "Pilling", note: "12% mention", type: "warn" },
  { name: "Shrinkage", note: "3% mention", type: "soft" },
  { name: "Transparency", note: "5% mention", type: "soft" },
  { name: "Seam issues", note: "8% mention", type: "warn" }
];

function renderReviews() {
  const metricsContainer = document.getElementById("review-metrics");
  const flagsContainer = document.getElementById("review-flags");

  if (metricsContainer) {
    metricsContainer.innerHTML = "";
    reviewMetrics.forEach(m => {
      const row = document.createElement("div");
      row.className = "metric-row";
      row.innerHTML = `
        <div class="metric-top">
          <span class="metric-name">
            <span class="metric-emoji">${m.emoji}</span>
            <span>${m.name}</span>
          </span>
          <span>${m.value}%</span>
        </div>
        <div class="metric-bar">
          <div class="metric-bar-inner" style="width: ${m.value}%;"></div>
        </div>
      `;
      metricsContainer.appendChild(row);
    });
  }

  if (flagsContainer) {
    flagsContainer.innerHTML = "";
    reviewFlags.forEach(f => {
      const card = document.createElement("div");
      card.className = `flag-card flag-${f.type}`;
      card.innerHTML = `
        <div class="flag-title">${f.name}</div>
        <div class="flag-note">${f.note}</div>
      `;
      flagsContainer.appendChild(card);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  document
    .getElementById("tab-fiber")
    .addEventListener("click", () => showView("view-fiber"));
  document
    .getElementById("tab-reviews")
    .addEventListener("click", () => showView("view-reviews"));

  attachHoverNotes();
  renderReviews();
});


// === Materials Section  ===
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

const plantIcons = [
  "🌿", "🍃", "🌱", "🌾", "🍀"
]

// == Materials Bar Rendering ==
function updateFiberFromMaterials(materials, notes) {
  const bar = document.querySelector(".composition-bar");
  const legend = document.querySelector(".composition-legend");
  if (!bar || !legend || !materials || !materials.length) {
    return;
  }

  // Clear existing static markup
  bar.innerHTML = "";
  legend.innerHTML = "";

  const maxSegments = 5; // you have seg-1..5 and dot-1..5 styled in CSS
  materials.slice(0, maxSegments).forEach((mat, index) => {
    const segIndex = index + 1;

    // Bar segment
    const seg = document.createElement("div");
    seg.className = `seg seg-${segIndex}`;
    seg.style.width = `${mat.percent}%`;
    bar.appendChild(seg);

    // Legend item
    const item = document.createElement("div");
    item.className = "legend-item has-note";


    const materialName = mat.name.replace(/\b\w/g, char => char.toUpperCase());
    item.dataset.noteTitle = `${plantIcons[index]} ` + materialName
    item.dataset.noteBody = notes[mat.name]
      ? notes[mat.name].environmental_impact_desc
      : `${mat.percent}% ${materialName}`;

    item.innerHTML = `
      <span class="legend-dot dot-${segIndex}"></span>
      <span class="legend-label">${materialName}</span>
      <span class="legend-percent">${mat.percent}%</span>
    `;

    legend.appendChild(item);
  });

  // Re-wire hover listeners for the new .has-note elements
  attachHoverNotes();
}

// === Care Section  ===
const careIconMap = {
  "wash": "💧",
  "dry": "🌬️",
  "avoid": "❌",
  "recycle": "♻️",
  "recommend": "👍"
};

function updateCareInstructions(careInstructions, materials) {
  const careContainer = document.querySelector(".care-row");
  if (!careContainer || !careInstructions || !Object.keys(careInstructions).length) {
    return;
  }

  careContainer.innerHTML = "";
  let majorityFiber = null;
  for (const fiber in careInstructions) {
    if (!majorityFiber || (materials[fiber] && materials[fiber].percent > materials[majorityFiber].percent)) {
      majorityFiber = fiber;
    }
  }

  for (const [key, value] of Object.entries(careInstructions[majorityFiber])) {
    const item = document.createElement("div");
    item.className = "care-item";
    if (value.note) {
      item.className = "care-item has-note";
    }

    item.dataset.noteTitle = key.charAt(0).toUpperCase() + key.slice(1);
    item.dataset.noteBody = value.note;

    item.innerHTML = `
      <div class="care-icon ${value.style}">${careIconMap[key]}</div>
      <div class="care-label">${value.label}</div>
    `;
    careContainer.appendChild(item);
  }
  // Re-wire hover listeners for the new .has-note elements
  attachHoverNotes();
}

// === Durability Section  ===
function updateDurabilityScore(durabilityScores, materials) {
  const lifespanCardEl = document.querySelector(".lifespan-card");
  const lifespanScoreEl = document.querySelector(".lifespan-score");
  const lifespanPillEl = document.querySelector(".lifespan-pill");
  if (!lifespanScoreEl || !lifespanPillEl || !durabilityScores || !materials) {
    return;
  }

  let score = 0;

  let highestMat = null;
  let lowestMat = null;
  for (const mat of materials) {
    const matScore = durabilityScores[mat.name];
    score += matScore * (mat.percent / 100);
    if (!highestMat || matScore > durabilityScores[highestMat.name]) {
      highestMat = mat;
    }
    if (!lowestMat || matScore < durabilityScores[lowestMat.name]) {
      lowestMat = mat;
    }
  }

  let majorityFiber = getMajorityFiber(materials);

  lifespanScoreEl.textContent = score.toFixed(1);
  if (score >= 4) {
    lifespanPillEl.textContent = "Long lasting";
    lifespanPillEl.className = "lifespan-pill pill-long";

    // lifespanCardEl.dataset.noteBody += ` This garment consists of high-quality fabrics like ${highestMat.name}, which contribute to its long-lasting durability.`;
  } else if (score >= 2.5) {
    lifespanPillEl.textContent = "Moderate";
    lifespanPillEl.className = "lifespan-pill pill-moderate";

    // lifespanCardEl.dataset.noteBody += ` This garment largely consists of ${majorityFiber}, which has a durability score of ${durabilityScores[majorityFiber]}.`;
  } else {
    lifespanPillEl.textContent = "Short lifespan";
    lifespanPillEl.className = "lifespan-pill pill-short";

    // lifespanCardEl.dataset.noteBody += `This garment contains lower-durability fabrics like ${lowestMat.name}, which may lead to quicker wear and tear with regular use.`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup script loaded: sending message to background to get materials");
  chrome.runtime.sendMessage({ action: "getMaterials" }, function (response) {
    console.log("Response received from background:", response);
    if (!response || !Array.isArray(response.materials)) {
      console.log("No parsed materials received");
      updateFiberFromMaterials([]); // fallback / empty
      return;
    }

    console.log("POPUP: Parsed materials from content script:", response);
    updateFiberFromMaterials(response.materials, response.notes);
    
    // Now get care instructions
    chrome.runtime.sendMessage({ action: "getCareInstructions" }, function (careResponse) {
      console.log("Care instructions response received from background:", careResponse);
      if (!careResponse) {
        console.log("No materials received for care instructions");
        updateCareInstructions([]); // fallback / empty
        return;
      }

      console.log("Popup received care instructions from background:", careResponse);
      updateCareInstructions(careResponse, response.materials);
    });

    // Now get durability score 
    chrome.runtime.sendMessage({ action: "getDurabilityScores" }, function (durabilityResponse) {
      console.log("Durability scores response received from background:", durabilityResponse);
      if (!durabilityResponse) {
        console.log("No materials received for durability scores");
        return;
      }

      console.log("Popup received durability scores from background:", durabilityResponse);
      updateDurabilityScore(durabilityResponse, response.materials);
    });
  });
});
