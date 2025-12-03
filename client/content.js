let materials = [];
console.log("🌸 Magnolia content script loaded 🌸");

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

function normalizeFiberName(name) {
  const n = name.toLowerCase().replace(/[™®]/g, "").trim();
  return n;
}

// Match things like:
//  "53% Rayon"
//  "24% Polyester"
//  "57% Regeneratively Grown Cotton"
//  "43% TENCEL™ Lyocell"
//
// Stops at comma, " and ", period, semicolon, or end of string.
const segmentRegex =
  /(\d+)\s*%\s*([A-Za-z][A-Za-z\s-™]*?)(?=(?:,|\band\b|\.|;|\n|$))/gi;

function extractMaterialsFromText(text) {
  const result = [];
  if (!text) return result;

  let match;
  while ((match = segmentRegex.exec(text)) !== null) {
    const percent = parseInt(match[1], 10);
    if (isNaN(percent)) continue;

    let rawName = match[2].trim().replace(/\s+/g, " ");
    const lower = rawName.toLowerCase();

    // Only keep if it looks like a real fiber (contains a base-fiber word)
    const isFiber = baseFibers.some(word => lower.includes(word));
    if (!isFiber) continue;

    // Trim rawName to end at the first base-fiber keyword
    let cleanedName = rawName;
    let baseFiber = ""

    for (const word of baseFibers) {
      const idx = cleanedName.toLowerCase().indexOf(word);
      if (idx !== -1) {
        cleanedName = cleanedName.slice(0, idx + word.length);
        baseFiber = word;
        break;
      }
    }

    cleanedName = cleanedName.trim();
    cleanedName = normalizeFiberName(cleanedName);

    if (!cleanedName) continue;

    if (!result.some(m => m.name === cleanedName && m.percent === percent)) {
      result.push({ percent, name: cleanedName, baseFiber: baseFiber });
    }
  }

  return result;
}

function checkDOM() {
  materials = [];
  console.log("🌸 Magnolia: checking DOM for materials information");

  const allElements = document.querySelectorAll("body *");
  for (const el of allElements) {
    const text = el.innerText;
    if (!text) continue;

    const found = extractMaterialsFromText(text);
    if (found.length) {
      materials = found;
      console.log("🌸 Magnolia: Final parsed materials:", materials);
      break;
    }
  }
}

// Run once after page loads to warm cache
window.addEventListener("load", checkDOM);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapePageForMaterials") {
    console.log(
      "🌸 Magnolia: Content script received scrapePageForMaterials message from background"
    );

    if (!materials.length) {
      checkDOM();
    }

    console.log("🌸 Magnolia: Returning parsed materials:", materials);
    // Send back the parsed array
    sendResponse({ materials });
    return true;
  }
});

/**
 * Find the top-level container that likely holds all the reviews.
 * 1. Prefer elements whose id/class/data-testid mention "review".
 * 2. If none, fall back to containers that contain many "rating" elements.
 *
 * Returns: HTMLElement | null
 */
function findReviewContainer() {
  const all = Array.from(document.querySelectorAll("body *"));

  // --- 1) REVIEW-BASED SEARCH ------------------------------------
  const reviewCandidates = [];

  for (const el of all) {
    const id = (el.id || "").toLowerCase();
    const className = (el.className || "").toString().toLowerCase();
    const testId =
      (el.getAttribute("data-testid") ||
        el.getAttribute("data-test-id") ||
        "").toLowerCase();

    const attrs = `${id} ${className} ${testId}`;

    if (attrs.includes("review")) {
      reviewCandidates.push(el);
    }
  }

  if (reviewCandidates.length) {
    // Pick the “topmost” candidate: one that is not contained by any other candidate
    const topLevel = reviewCandidates.filter(
      el => !reviewCandidates.some(other => other !== el && other.contains(el))
    );

    // Heuristic: choose the first top-level; you can add more scoring later
    if (topLevel.length) {
      console.log("Review container (review-based):", topLevel[0]);
      return topLevel[0];
    }
  }

  // --- 2) RATING-BASED FALLBACK ---------------------------------
  // For pages like Uniqlo where only the star row mentions "rating"

  const ratingElems = [];

  for (const el of all) {
    const id = (el.id || "").toLowerCase();
    const className = (el.className || "").toString().toLowerCase();
    const testId =
      (el.getAttribute("data-testid") ||
        el.getAttribute("data-test-id") ||
        "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const text = (el.textContent || "").toLowerCase();

    const attrs = `${id} ${className} ${testId} ${aria} ${text}`;

    if (attrs.includes("rating")) {
      ratingElems.push(el);
    }
  }

  if (!ratingElems.length) {
    console.warn("No review / rating hints found");
    return null;
  }

  // For each rating element, walk up to a reasonable container (section/div/ul/ol)
  // and count how many rating elements land in each. The one with the most
  // is likely the reviews block.
  const containerCounts = new Map();

  for (const el of ratingElems) {
    const container =
      el.closest("section, ul, ol, div[role='tabpanel'], div[role='dialog'], div");

    if (!container) continue;

    const current = containerCounts.get(container) || 0;
    containerCounts.set(container, current + 1);
  }

  let bestContainer = null;
  let bestScore = 0;

  for (const [container, count] of containerCounts.entries()) {
    if (count > bestScore) {
      bestScore = count;
      bestContainer = container;
    }
  }

  if (bestContainer) {
    console.log("Review container (rating-based):", bestContainer, "score:", bestScore);
  } else {
    console.warn("Rating elements found but no suitable container identified");
  }

  return bestContainer;
}

