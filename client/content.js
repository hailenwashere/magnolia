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
  "polyamide"
];

function normalizeFiberName(name) {
  const n = name.toLowerCase().replace(/[™®]/g, "").trim();
  return n;
}

// Very simple % + word(s) matcher.
// Example matches:
//  59% polyamide
//  23% viscose
//  3% elastane
const segmentRegex =
  /(\d+)\s*%\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)/g;

function extractMaterialsFromText(text) {
  const result = [];
  if (!text) return result;

  let match;
  while ((match = segmentRegex.exec(text)) !== null) {
    const percent = parseInt(match[1], 10);
    let rawName = match[2].trim();

    if (isNaN(percent)) continue;

    // Normalize: lowercase, remove TM / R, compress spaces
    let lower = rawName.toLowerCase().replace(/[™®]/g, "").replace(/\s+/g, " ");

    // Map common synonyms
    if (lower.includes("spandex")) lower = "elastane";
    if (lower.includes("polyamide")) lower = "polyamide";

    // Keep only if it contains any base fiber word
    const isFiber = baseFibers.some(word => lower.includes(word));
    if (!isFiber) {
      continue;
    }

    // Find the first base fiber that appears and trim to that word
    let baseFiber = lower;
    for (const word of baseFibers) {
      const idx = lower.indexOf(word);
      if (idx !== -1) {
        baseFiber = word;
        lower = lower.slice(0, idx + word.length);
        break;
      }
    }

    const cleanedName = lower.trim();

    const existing = result.find(m => m.name === cleanedName);
    if (!existing) {
      result.push({ percent, name: cleanedName, baseFiber });
    } else if (percent > existing.percent) {
      existing.percent = percent;
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
      for (const m of found) {
        const existing = materials.find(x => x.name === m.name);
        if (!existing) {
          materials.push(m);
        } else if (m.percent > existing.percent) {
          existing.percent = m.percent;
        }
      }
    }
  }

  console.log("🌸 Magnolia: Final parsed materials:", materials);
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

