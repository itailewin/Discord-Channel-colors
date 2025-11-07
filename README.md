# Discord Channel Highlighter



A simple but powerful Chrome extension that allows you to apply custom background colors to specific Discord channels, making your important channels stand out in a crowded sidebar.

![Discord Channel Highlighter](screenshot.png) <!-- TODO: Replace with a real screenshot URL -->
## Features

-   🎨 **Custom Highlighting:** Assign a unique, solid background color to any channel.
-   🔍 **Automatic Channel Detection:** The extension automatically finds channels on the page and lists them in a convenient dropdown.
-   ✏️ **Easy Management:** A simple popup UI lets you add, edit colors, and remove highlights with just a few clicks.
-   ☁️ **Synced Settings:** Your highlight configurations are saved to your Chrome account and synced across all your devices.
-   ⚡ **Dynamic & Instant:** Styles are applied instantly without needing to refresh the page and persist as you navigate between servers.
-   👓 **Enhanced Readability:** Automatically applies a dark font color to highlighted channels to ensure the text is always clear and easy to read.

## Installation

Since this extension is not yet on the Chrome Web Store, you can install it locally by following these steps:

1.  **Download:** Download this project as a ZIP file and unzip it, or clone the repository to your local machine.
2.  **Open Chrome Extensions:** Open Google Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode:** In the top-right corner of the extensions page, turn on the "Developer mode" toggle.
4.  **Load the Extension:** Click the "Load unpacked" button that appears on the top-left.
5.  **Select Folder:** In the file selection dialog, navigate to and select the folder where you saved the project files (the folder containing `manifest.json`).

The extension icon will now appear in your Chrome toolbar, and it will be active when you are on Discord.

## How to Use

1.  **Navigate to Discord:** Open a Discord server in your browser (`https://discord.com/channels/...`).
2.  **Open the Popup:** Click on the Discord Channel Highlighter icon in your Chrome toolbar.
3.  **Add a Highlight:**
    -   Select a channel from the dropdown menu.
    -   Pick a color using the color picker.
    -   The channel will be highlighted instantly.
4.  **Edit a Highlight's Color:**
    -   In the popup, click on any saved channel in the list.
    -   The form will populate with that channel's data.
    -   Choose a new color and click the "Update" button.
5.  **Remove a Highlight:**
    -   Click the `×` button next to the channel name in the popup list.

## Project Structure

-   `manifest.json`: Defines the extension's permissions, scripts, and metadata.
-   `popup.html`: The HTML structure for the user interface popup.
-   `popup.js`: Handles the logic for the popup UI, including adding, editing, and removing settings.
-   `content.js`: The core script that runs on Discord pages. It finds channels, applies styles, and listens for updates from the popup.
-   `README.md`: You are here!

## Contributing

Contributions are welcome! If you have ideas for new features or find a bug, feel free to open an issue or submit a pull request.
