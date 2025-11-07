// Global array to hold the channel configuration objects
let channelSettings = [];

/**
 * Renders the current list of settings to the UI.
 */
function renderSettings() {
    const list = document.getElementById('settingsList');
    list.innerHTML = ''; // Clear existing list

    if (channelSettings.length === 0) {
        list.innerHTML = '<p style="color: #64748b; font-style: italic;">No channels configured yet.</p>';
        return;
    }

    channelSettings.forEach((setting, index) => {
        const item = document.createElement('div');
        item.className = 'setting-item';
        
        item.innerHTML = `
            <div>
                <span class="color-preview" style="background-color: ${setting.color};"></span>
                <span class="setting-name">${setting.name}</span>
            </div>
            <button class="btn-remove" data-index="${index}">&times;</button>
        `;

        // Add a click event listener to the entire item for editing functionality.
        item.addEventListener('click', (e) => {
            // Prevent the edit action if the user clicked the remove button.
            if (e.target.classList.contains('btn-remove')) return;
            
            // Populate the form with the data of the clicked setting.
            populateFormForEdit(index);
        });

        list.appendChild(item);
    });

    // Attach event listeners for removal buttons
    list.querySelectorAll('.btn-remove').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            removeSetting(index);
        });
    });
}

/**
 * Saves the current channelSettings array to chrome.storage.sync.
 */
function saveSettings() {
    chrome.storage.sync.set({ channelHighlights: channelSettings }, () => {
        const status = document.getElementById('save-status');
        status.textContent = 'Settings saved!';
        setTimeout(() => { status.textContent = ''; }, 1500);
        
        // Signal content script to update its settings cache
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Only send if the active tab is likely a Discord page
            if (tabs[0] && tabs[0].url.includes('discord.com')) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "settingsUpdated" }, () => {
                    if (chrome.runtime.lastError) {
                        console.log("Could not send settings update, content script may not be ready.");
                    }
                });
            }
        });

        // After saving, re-render to reflect the current state (e.g., removal)
        renderSettings(); 
    });
}

/**
 * Loads settings from storage on startup.
 */
function loadSettings() {
    chrome.storage.sync.get(['channelHighlights'], (result) => {
        channelSettings = result.channelHighlights || [];
        renderSettings();
    });
}

/**
 * Requests channel names from the content script and populates the dropdown.
 */
function populateChannelSelector() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('discord.com')) {
            // Send message to the active tab's content script
            chrome.tabs.sendMessage(tabs[0].id, { action: "getChannelNames" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Could not connect to content script:", chrome.runtime.lastError.message);
                    document.getElementById('save-status').textContent = 'Error: Refresh Discord and try again.';
                    return; 
                }
                
                const selector = document.getElementById('channelSelector');
                const channelNames = response?.channelNames || [];
                
                if (channelNames.length > 0) {
                    selector.innerHTML = '<option value="">-- Select Channel --</option>'; // Default prompt
                    channelNames.forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        selector.appendChild(option);
                    });
                } else {
                    // If no channels are found, show a message in the dropdown.
                    selector.innerHTML = '<option value="">-- No channels found --</option>';
                    selector.disabled = true;
                }
            });
        } else {
            // Handle case where the user is not on a discord.com page
            document.getElementById('save-status').textContent = 'Please open a Discord tab.';
        }
    });
}

/**
 * Populates the input form with data from an existing setting for editing.
 * @param {number} index - The index of the setting to edit.
 */
function populateFormForEdit(index) {
    const setting = channelSettings[index];
    if (!setting) return;

    // Select the channel in the dropdown and disable it during edit.
    const selector = document.getElementById('channelSelector');
    selector.value = setting.name;
    selector.disabled = true;

    // Populate the color picker.
    document.getElementById('channelColor').value = setting.color;

    // Change the button text to "Update".
    document.getElementById('addChannel').textContent = 'Update';
}


/**
 * Handles adding a new channel setting from the input fields/selector.
 */
function addSetting() {
    const selector = document.getElementById('channelSelector');
    const colorInput = document.getElementById('channelColor');

    const name = selector.value.trim();
    
    const color = colorInput.value;
    const addButton = document.getElementById('addChannel');

    if (name) {
        // Check if channel already exists (case-insensitive)
        const existingIndex = channelSettings.findIndex(s => s.name.toLowerCase() === name.toLowerCase());

        if (existingIndex > -1) {
            // Update existing entry
            channelSettings[existingIndex].color = color;
        } else {
            // Add new entry
            channelSettings.push({ name, color });
        }
        
        saveSettings();

        // Reset the form to its default "Add" state.
        selector.value = '';
        selector.disabled = false;
        if (addButton.textContent === 'Update') {
            addButton.textContent = 'Add';
        }
    }
}

/**
 * Handles removing a channel setting by index.
 * @param {number} index - The index of the setting to remove.
 */
function removeSetting(index) {
    if (index >= 0 && index < channelSettings.length) {
        channelSettings.splice(index, 1);
        saveSettings();
    }
}

// Initialize listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    // Request channel list immediately
    populateChannelSelector(); 
    
    document.getElementById('addChannel').addEventListener('click', addSetting);
    
    const selector = document.getElementById('channelSelector');
    
    selector.addEventListener('change', (e) => {
        // Automatically add if a channel is selected from the dropdown.
        // This provides a quick, one-click way to add a highlight.
        if (e.target.value) {
            addSetting();
        }
    });
});