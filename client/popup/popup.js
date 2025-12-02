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

const baseFibers = [
  "cotton",
  "cashmere",
  "rayon",
  "polyester",
  "nylon",
  "linen",
  "silk",
  "wool",
  "viscose",
  "modal",
  "acrylic",
  "elastane",
  "spandex",
  "hemp",
  "lyocell",
  "polyamide",
  "elastane"
];

// Map from fiber name → hover note text (optional)
const fiberNotes = {
  cotton: {
    title: "Cotton",
    body: "Natural, breathable, comfortable. Can shrink and is resource-intensive to grow."
  },
  "recycled polyester": {
    title: "Recycled polyester",
    body: "Durable synthetic made from recycled plastic. Reduces waste but can shed microplastics."
  },
  polyester: {
    title: "Polyester",
    body: "Very durable and wrinkle-resistant, but not very breathable and can pill over time."
  },
  rayon: {
    title: "Rayon",
    body: "Soft and drapey semi-synthetic, but production can be chemically intensive."
  },
  wool: {
    title: "Wool",
    body: "Warm, odor-resistant natural fiber. Can felt/shrink if washed hot or agitated."
  },
  spandex: {
    title: "Spandex / Elastane",
    body: "Adds stretch and recovery. Can lose elasticity with heat or harsh washing."
  }
};

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
    item.dataset.noteTitle = materialName
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

// Machine wash cold, Air-dry recommended, otherwise tumble dry low.
// careInstructions = {"wash": "Machine wash cold", "dry": "Air-dry recommended, otherwise tumble dry low", "note": ""};
{/* <div class="care-item has-note" data-note-title="Wash"
    data-note-body="Best choice — preserves energy and helps prevent shrinking or color fading.">
    <div class="care-icon cold">💧</div>
    <div class="care-label">Cold</div>
</div> */}

const careInstructionsExample = {
  "wash": {
    "note": "Machine wash cold",
    "label": "Cold",
    "style": "blue"
  },
  "dry": {
    "note": "Air-dry recommended, otherwise tumble dry low",
    "label": "Low",
    "style": "yellow"
  },
  "avoid": {
    "note": "Avoid bleach",
    "label": "No bleach",
    "style": "red"
  },
  "recycle": {
    "note": "Recycle garment where possible",
    "label": "Recycle",
    "style": "green"
  },
  "recommend": {
    "note": "Recommended by Magnolia for its sustainability",
    "label": "Recommended",
    "style": "green"
  }
};

const careIconMap = {
  "wash": "💧",
  "dry": "🌬️",
  "avoid": "❌",
  "recycle": "♻️",
  "recommend": "👍"
};

// === Care Section  ===
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
  });
});



