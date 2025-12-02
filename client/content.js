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
