let materialsText = "";

function checkDOM() {
  materialsText = "";
  
  const allElements = document.querySelectorAll("body *");
  for (const el of allElements) {
    const text = el.innerText;
    if (!text) continue;
    if (text.includes("%") && text.match(/Polyester|Wool|Rayon|Spandex/i)) {
      materialsText = text.trim();
      break;
    }
  }
}

// Run after the page loads
window.addEventListener("load", checkDOM);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapePageForMaterials") {
    console.log("Content script received scrapePageForMaterials message from background");

    if (!materialsText) {
      checkDOM();
    }

    console.log("Materials found by content script:", materialsText);
    // respond directly to background
    sendResponse({ materials: materialsText });
    return true; // keep sendResponse async-safe (in case you later make checkDOM async)
  }
});
