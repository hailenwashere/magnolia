function modifyInput(materialsText) {
    // Simple function to clean up and format the materials text
    if (!materialsText) return "";
    return materialsText.replace(/\s+/g, ' ').trim();
}

// Simple toggling between the two views
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  if (id === "view-materials") {
    document.getElementById("tab-materials").classList.add("active");
  } else {
    document.getElementById("tab-reviews").classList.add("active");
  }
}

// Example data – replace with scraped values
const materialsData = [
  { name: "Organic Cotton", percent: 65, dotClass: "dot-green" },
  { name: "Recycled Polyester", percent: 30, dotClass: "dot-blue" },
  { name: "Elastane", percent: 5, dotClass: "dot-pink" }
];

const reviewMetrics = [
  { name: "Fit", value: 87 },
  { name: "Quality", value: 78 },
  { name: "Comfort", value: 92 },
  { name: "Value", value: 64 }
];

const reviewFlags = [
  { name: "Pilling", note: "12% mention", type: "warn" },
  { name: "Shrinkage", note: "3% mention", type: "safe" },
  { name: "Transparency", note: "5% mention", type: "safe" },
  { name: "Seam issues", note: "8% mention", type: "warn" }
];

function renderMaterials() {
  const list = document.getElementById("materials-list");
  list.innerHTML = "";

  materialsData.forEach(m => {
    const li = document.createElement("li");
    li.className = "pill-row";
    li.innerHTML = `
      <div class="pill-left">
        <span class="pill-dot ${m.dotClass}"></span>
        <span class="pill-label">${m.name}</span>
      </div>
      <span>${m.percent}%</span>
    `;
    list.appendChild(li);
  });
}

function renderReviews() {
  const metricsContainer = document.getElementById("review-bars");
  metricsContainer.innerHTML = "";
  reviewMetrics.forEach(m => {
    const row = document.createElement("div");
    row.className = "metric-row";
    row.innerHTML = `
      <div class="metric-top">
        <span>${m.name}</span>
        <span>${m.value}%</span>
      </div>
      <div class="metric-bar">
        <div class="metric-bar-inner" style="width: ${m.value}%;"></div>
      </div>
    `;
    metricsContainer.appendChild(row);
  });

  const flagsContainer = document.getElementById("review-flags");
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

document.addEventListener("DOMContentLoaded", () => {
  // Tab wiring
  document
    .getElementById("tab-materials")
    .addEventListener("click", () => showView("view-materials"));
  document
    .getElementById("tab-reviews")
    .addEventListener("click", () => showView("view-reviews"));

  renderMaterials();
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