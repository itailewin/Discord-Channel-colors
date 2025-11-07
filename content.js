// --- Constants and Global State ---
const CHANNEL_HIGHLIGHT_CLASS = 'channel-highlighted-by-extension';
const FIREBASE_LOG_PREFIX = '[Discord Highlighter]';
let currentSettings = []; // Global state for the latest channel settings

// --- Utility Functions ---

/**
 * Logs to the console with a prefix.
 * @param {string} message 
 */
function log(message) {
    console.log(`${FIREBASE_LOG_PREFIX} ${message}`);
}

/**
 * Finds and styles Discord channel elements based on saved settings.
 * @param {Array<{name: string, color: string}>} settings - Array of channel settings.
 */
function applyStyles(settings) {
    if (!settings || settings.length === 0) {
        // Remove existing styles if settings are cleared
        document.querySelectorAll(`.${CHANNEL_HIGHLIGHT_CLASS}`).forEach(el => {
            el.style.backgroundColor = '';
            el.style.borderRadius = ''; // Ensure style is fully removed
            el.classList.remove(CHANNEL_HIGHLIGHT_CLASS);
        });
        return;
    }

    // Convert settings to a map for quick lookup (case-insensitive)
    const highlightMap = new Map(
        settings.map(s => [s.name.toLowerCase(), s.color])
    );

    // **UPDATED SELECTOR STRATEGY:** Target the `li` elements with the `data-dnd-name` attribute as requested.
    const channelElements = document.querySelectorAll('li[data-dnd-name]');

    if (channelElements.length === 0) {
        return;
    }

    let appliedCount = 0;

    channelElements.forEach(channelElement => {
        // Directly get the channel name from the specified attribute.
        const channelName = channelElement.getAttribute('data-dnd-name')?.trim();
        
        if (!channelName) return;

        // Final check against the map using the extracted name
        const color = highlightMap.get(channelName.toLowerCase());

        // **UPDATED SELECTOR:** Find the specific element containing the channel name text,
        // using the more precise selector based on the user-provided HTML structure.
        const nameElement = channelElement.querySelector('div[class^="name__"]');

        if (color) {
            // Apply the style to the `li` element itself.
            channelElement.style.backgroundColor = color; // Use opaque color as requested
            channelElement.style.borderRadius = '4px';
            channelElement.classList.add(CHANNEL_HIGHLIGHT_CLASS);

            // Apply dark font color to the text element for readability.
            if (nameElement) nameElement.style.color = '#1E293B';

            appliedCount++;
        } else if (channelElement.classList.contains(CHANNEL_HIGHLIGHT_CLASS)) {
            // If the channel was previously styled but is no longer in settings, remove the style
            channelElement.style.backgroundColor = '';
            channelElement.style.borderRadius = '';
            channelElement.classList.remove(CHANNEL_HIGHLIGHT_CLASS);

            // Also reset the font color.
            if (nameElement) nameElement.style.color = '';
        }
    });

    log(`Style application complete. Channels highlighted: ${appliedCount}`);
}

/**
 * Loads settings from storage and updates the global state and UI.
 */
function loadAndApplySettings() {
    chrome.storage.sync.get(['channelHighlights'], (result) => {
        // **THE FIX**: Check if the extension context is still valid before proceeding.
        // This prevents errors when the extension is reloaded.
        if (chrome.runtime.lastError) {
            log(`Error loading settings (context likely invalidated): ${chrome.runtime.lastError.message}`);
            return; // Stop execution.
        }
        currentSettings = result.channelHighlights || [];
        log(`Settings loaded. ${currentSettings.length} channels configured.`);
        applyStyles(currentSettings);
    });
}

/**
 * Initializes the MutationObserver to watch for Discord DOM changes.
 */
function observeChannels() {
    // 1. Initial load and apply
    loadAndApplySettings();

    // 2. Find the target container for the channel list (a stable element)
    // This is a robust selector targeting the main channel list scroll area in the sidebar
    const channelListContainer = document.querySelector('nav[role="navigation"]');
    
    if (!channelListContainer) {
        log('Channel navigation container not found. Retrying in 2 seconds...');
        setTimeout(observeChannels, 2000); // Retry until found
        return;
    }

    log('Channel container found. Starting MutationObserver.');

    // 3. Set up the observer
    const observer = new MutationObserver((mutationsList, observer) => {
        // IMPORTANT FIX: Use the module-scoped currentSettings for every mutation check
        // This ensures new styles are applied when channels are dynamically loaded via scrolling/SPA navigation.
        applyStyles(currentSettings); 
    });

    // Configuration for the observer: watch for child elements being added/removed
    const config = { childList: true, subtree: true };

    // Start observing the target node for configured mutations
    observer.observe(channelListContainer, config);
    
}

/**
 * Sets up the message listener to communicate with the popup.
 * This is set up immediately to prevent race conditions.
 */
function initializeMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getChannelNames") {
            log("Received request for channel names.");
            // Use the specified selector to get all channel names.
            const channelElements = document.querySelectorAll('li[data-dnd-name]');
            const channelNames = Array.from(channelElements)
                .map(el => el.getAttribute('data-dnd-name')?.trim())
                .filter(Boolean); // Filter out any null/undefined values
            
            log(`Found ${channelNames.length} channels. Sending to popup.`);
            sendResponse({ channelNames: channelNames });
            return true; // Keep message channel open for async response.
        }

        if (request.action === "settingsUpdated") {
            log("Received settings update signal. Reloading settings and reapplying styles.");
            loadAndApplySettings(); 
        }
    });
    log("Message listener initialized.");
}

// --- Script Entry Point ---

// 1. Set up the message listener immediately to avoid connection errors.
initializeMessageListener();

// 2. Start the process of observing the DOM for channels.
observeChannels();