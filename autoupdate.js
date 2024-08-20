const { ipcMain, app, autoUpdater } = require('electron');
const storage = require('electron-json-storage');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const semver = require('semver');
console.log("autoupdate3");
function setupAutoUpdate() {
    console.log("autoupdate4");
    ipcMain.on('loading-completed', async () => {
        // Ensure userId is stored
        storage.has('userId', (error, hasKey) => {
            if (error) throw error;
            if (!hasKey) {
                storage.set('userId', uuidv4(), (error) => {
                    if (error) throw error;
                });
            }
        });

        // Check for updates after loading
        await checkUpdateFromGitHub();
    });

    ipcMain.on('requestCheckUpdate', async () => {
        await checkUpdateFromGitHub();
    });

    ipcMain.on('requestUpdate', () => {
        autoUpdater.checkForUpdates();
    });

    ipcMain.on('abortUpdate', () => {
        autoUpdater.abortDownload();
    });

    autoUpdater.on('update-downloaded', () => {
        setTimeout(() => {
            app.relaunch();
            app.exit();
        }, 3000);
    });

    autoUpdater.on('error', (error) => {
        console.error(`Error in auto-updater: ${error.message}`);
    });
}

async function checkUpdateFromGitHub() {
    const githubApiUrl = 'https://api.github.com/repos/<owner>/<repo>/releases/latest'; // Replace <owner> and <repo> with actual values

    try {
        const response = await fetch(githubApiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // GitHub requires a user-agent header
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        const githubVersion = data.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
        const appVersion = app.getVersion();

        // Compare the versions using semver
        if (semver.lt(appVersion, githubVersion)) {
            autoUpdater.checkForUpdates(); // Start the update process silently
        }
    } catch (error) {
        console.error('Error checking for update from GitHub:', error);
    }
}

module.exports = { setupAutoUpdate, checkUpdateFromGitHub };

