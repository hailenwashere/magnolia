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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getMaterials') {
        console.log("Background script received getMaterials message from popup");

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getCareInstructions') {
        console.log("Background script received getCareInstructions message from popup");
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getDurabilityScores') {
        console.log("Background script received getDurabilityScores message from popup");
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