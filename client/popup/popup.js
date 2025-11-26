// function modifyInput(materialsText) {
//   // Simple function to clean up and format the materials text
//   if (!materialsText) return "";
//   return materialsText.replace(/\s+/g, ' ').trim();
// }

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


// document.addEventListener("DOMContentLoaded", function () {
//     console.log("Popup script loaded: sending message to background to get materials");
//     chrome.runtime.sendMessage({ action: "getMaterials" }, function (response) {
//         console.log("Response received from background:", response);
//         if (response == null) {
//             console.log("No response received");
//             return;
//         }
//         if (response.materials) {
//             console.log("Materials found:", response.materials);
//             let materialList = modifyInput(response.materials);
//             document.getElementById("materialList").value = materialList;
//             // save highlighted materials for next time user opens extension
//             // saveUserInput();
//         } else {
//             console.log("No materials found in response");
//             document.getElementById("materialList").value = "No materials detected on this page";
//         }
//     });
// });