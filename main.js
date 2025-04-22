const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, Notification ,shell} = require('electron');
const path = require('path');
const fs = require('fs');
const screenshot = require('screenshot-desktop');
let hasRunFirst = false;

app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe')
});


let mainWindow;
let tray;
let captureInterval;

let captureSettings = {
  interval: 5000,
  folder: app.getPath('desktop'), // ✅ safe default value
  format: 'png'
};


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
  });
 
  
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
  
  tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
  tray.setToolTip('Screenshot App');
  
  tray.on('click', () => {
    mainWindow.show();
  });
  
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Screenshot App');
  tray.setContextMenu(contextMenu);
}

function takeScreenshot() {
  captureNow(); 
}

function captureNow() {
  const date = new Date();

  //  Organize by date-based folder
  const folderName = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  const basePath = path.join(captureSettings.folder, folderName);
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const timestamp = date.toISOString().replace(/:/g, '-');
  const filename = `screenshot_${timestamp}.${captureSettings.format}`;
  const filepath = path.join(basePath, filename);

  console.log("📸 Taking screenshot at:", filepath);
  screenshot({ format: captureSettings.format }).then((img) => {
    fs.writeFile(filepath, img, (err) => {
      if (err) return console.error('Error saving screenshot:', err);
      console.log('✅ Screenshot saved:', filename);

      // Notification
      new Notification({ title: 'Screenshot Taken', body: filename }).show();
      //  For preview in renderer (bonus)
      if (mainWindow) {
        mainWindow.webContents.send('screenshot-taken', filepath);
      }
    });
  }).catch((err) => console.error('Screenshot failed:', err));
}

function doFirstCountdown() {
  let countdown = 3;

  const countdownInterval = setInterval(() => {
    new Notification({ title: 'Get Ready!', body: `First screenshot in ${countdown}s` }).show();

    if (countdown === 1) {
      clearInterval(countdownInterval);
      takeScreenshot(); // First screenshot
      hasRunFirst = true;
    }

    countdown--;
  }, 1000);
}

ipcMain.handle('start-capturing', (e, settings) => {
  captureSettings = settings;
  hasRunFirst = false; // Reset on each start
  console.log("🔁 Starting capture every", captureSettings.interval, "ms in", captureSettings.folder);

  clearInterval(captureInterval);

  // Start main interval loop (without countdown)
  captureInterval = setInterval(() => {
    takeScreenshot();
  }, captureSettings.interval);

  // First screenshot with countdown
  doFirstCountdown();

  new Notification({ title: 'Capture Started', body: `Every ${settings.interval / 1000}s` }).show();
});


ipcMain.handle('stop-capturing', () => {
  clearInterval(captureInterval);
  new Notification({ title: 'Capture Stopped', body: 'Screenshot capturing stopped.' }).show();
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

ipcMain.on('set-folder', (event, folderPath) => {
  captureSettings.folder = folderPath;
});

const correctPassword = '1234';
ipcMain.handle('check-password', async (event, password) => {
  return password === correctPassword;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.on('open-file', (event, filePath) => {
  shell.openPath(filePath)
    .then((result) => {
      if (result) console.error('Failed to open file:', result);
    });
});
