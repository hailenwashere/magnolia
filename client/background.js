const SUPABASE_URL = 'https://xnkivxntmdbexvjzqtyn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_EBZ9UoqCN-w6qR_6ywHaew_rRz7GplB';

let materials = null;

async function fetchMaterialNotes(materials) {
  const fiberNames = materials.map((m) => m.name);
  const notes = {};
  for (const name of fiberNames) {
    console.log("Fetching notes for fiber:", name);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/fabric?select=environmental_impact_desc,durability_desc&type=eq.${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
      }
    );

    console.log(`BACKGROUND: Response for ${name}:`, response);
    if (!response.ok) {
      throw new Error(`Error fetching notes for ${name}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`BACKGROUND: Notes data for ${name}:`, data);
    notes[name] = {
      environmental_impact_desc: data[0]?.environmental_impact_desc || null,
      durability_desc: data[0]?.durability_desc || null
    };
  }

  return notes;

}

// getMaterials handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getMaterials') {
    console.log("BACKGROUND: getMaterials");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) {
        console.warn("No active tab found");
        sendResponse({ materials: null, error: "No active tab" });
        return;
      }

      const tabId = tabs[0].id;

      chrome.tabs.sendMessage(
        tabId,
        { action: 'scrapePageForMaterials' },
        async (response) => {
          if (chrome.runtime.lastError) {
            console.warn("tabs.sendMessage error:", chrome.runtime.lastError.message);
            // This is where "Receiving end does not exist" will show
            sendResponse({ materials: null, error: chrome.runtime.lastError.message });
            return;
          }

          sendResponse({
            materials: response.materials,
            notes: await fetchMaterialNotes(response.materials)
          });
          materials = response.materials;
        }
      );
    });

    // Keep the message channel open for the async sendResponse above
    return true;
  }
});

async function fetchCareInstructions(materials) {
  const fiberNames = materials.map((m) => m.name);
  const careInstructions = {};
  for (const name of fiberNames) {
    console.log("Fetching care instructions for fiber:", name);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/fabric?select=care_instructions_json&type=eq.${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
      }
    );

    console.log(`BACKGROUND: Response for ${name}:`, response);
    if (!response.ok) {
      throw new Error(`Error fetching care instructions for ${name}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`BACKGROUND: Care instructions data for ${name}:`, data);
    careInstructions[name] = data[0]?.care_instructions_json || null;
  }

  return careInstructions;
}

// getCareInstructions handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCareInstructions') {
    console.log("BACKGROUND: getCareInstructions");
    if (!materials || !materials.length) {
      console.log("No materials cached in background script");
      sendResponse(null);
      return;
    }

    fetchCareInstructions(materials).then((careInstructions) => {
      sendResponse(careInstructions);
    }).catch((error) => {
      console.error("Error fetching care instructions:", error);
      sendResponse(null);
    });

    // Keep the message channel open for the async sendResponse above
    return true;
  }
});

async function fetchDurabilityScores(materials) {
  const fiberNames = materials.map((m) => m.name);
  const durabilityScores = {};
  for (const name of fiberNames) {
    console.log("Fetching durability score for fiber:", name);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/fabric?select=durability&type=eq.${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
      }
    );

    console.log(`BACKGROUND: Response for ${name}:`, response);
    if (!response.ok) {
      throw new Error(`Error fetching durability score for ${name}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`BACKGROUND: Durability score data for ${name}:`, data);
    durabilityScores[name] = data[0]?.durability || null;
  }

  return durabilityScores;
}

// getDurabilityScores handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getDurabilityScores') {
    console.log("BACKGROUND: getDurabilityScores");
    if (!materials || !materials.length) {
      console.log("No materials cached in background script");
      sendResponse(null);
      return;
    }

    fetchDurabilityScores(materials).then((durabilityScores) => {
      sendResponse(durabilityScores);
    }).catch((error) => {
      console.error("Error fetching durability scores:", error);
      sendResponse(null);
    });

    // Keep the message channel open for the async sendResponse above
    return true;
  }
});


async function fetchBrandInfo(domainName) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/brand?select=name,sustainability_initiatives&domain_name=eq.${encodeURIComponent(domainName)}`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }
    }
  );

  console.log(`BACKGROUND: Brand info response for ${domainName}:`, response);
  if (!response.ok) {
    throw new Error(`Error fetching brand info for ${domainName}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`BACKGROUND: Brand info data for ${domainName}:`, data);
  if (data.length === 0) {
    return null;
  }

  return {
    name: data[0]?.name || null,
    sustainability_initiatives: data[0]?.sustainability_initiatives || null
  };
}

function normalizeHostname(hostname) {
  // Remove leading www.
  hostname = hostname.replace(/^www\./, "").toLowerCase();

  // Split hostname into parts
  const parts = hostname.split(".");

  // If hostname looks like: sub.domain.com
  // we want the second-to-last part for common domains
  const tlds = ["com", "net", "org", "gov", "edu", "io"];

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  // Many international TLDs like co.uk / com.au / co.jp
  const countrySecondLevelTLDs = ["co", "com", "net", "org"];

  if (countrySecondLevelTLDs.includes(secondLast) && parts.length >= 3) {
    // Example: amazon.co.uk → take "amazon"
    return parts[parts.length - 3];
  }

  // Regular case: domain.com → "domain"
  if (tlds.includes(last)) {
    return secondLast;
  }

  // Fallback: take the first element
  return parts[0];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getBrandInfo") {
    console.log("BACKGROUND: getBrandInfo");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) {
        console.warn("No active tab found");
        sendResponse(null);
        return;
      }

      let url;
      try {
        url = new URL(tabs[0].url);
      } catch (e) {
        console.warn("Invalid URL in active tab", e);
        sendResponse(null);
        return;
      }

      const hostname = url.hostname;

      if (!hostname) {
        console.log("No hostname found for active tab (hostname empty)");
        sendResponse(null);
        return;
      }

      const domain = normalizeHostname(hostname);

      fetchBrandInfo(domain)
        .then((brandInfo) => {
          sendResponse(brandInfo);
        })
        .catch((error) => {
          console.error("Error fetching brand info:", error);
          sendResponse(null);
        });
    });

    return true; // Keep message channel open
  }
});
