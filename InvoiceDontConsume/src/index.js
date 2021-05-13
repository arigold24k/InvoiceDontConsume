const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
var mainwindow;
var tagWin;

//tagwindow coding
tagWindow =  (cb) =>{
  tagWin = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Invoice Consignment Orders',
    webPreferences: {
      nodeIntegration: true
      ,contextIsolation: false
      ,enableRemoteModule: true
    }

  });

  tagWin.loadURL(url.format({
    pathname: path.join(__dirname, '/pages/taglist.html'),
    protocol: 'file:',
    slashes: true
  }));

  let intervalHolder;

  tagWin.on('closed', () => {
    mainwindow.webContents.send('update:refresh')
  });
  cb(null, tagWin);

};
//create menu templaet
const mainMenuTemplate = [
  {
    label: 'File',
    submenu:[
      {
        label: 'Refresh',
        click(){
          //importing tag window
          // tagWindow();
          //var tagWindow = require('./assets/windows/tagWindow')(BrowserWindow, path,url);
          mainwindow.webContents.send('update:refresh');
        }
      },
      // {
      //     label: 'Update Consignment PO',
      //     click(){
      //         POwindow();
      //         //var poWindow = require('./assets/windows/poWindow')(BrowserWindow, path,url);
      //     }
      // },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q': 'Ctrl+Q', //Acceloretor adds hot keys
        click(){
          app.quit();
        }
      }

    ]
  }
];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

createMainWindow = (v_menu) => {
  mainwindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
      ,contextIsolation: false
      ,enableRemoteModule: true
    }
  });

  mainwindow.loadURL(url.format({
    pathname: path.join(__dirname, '/pages/index.html'),
    protocol: 'file:',
    slashes: true
  }));
  //want to close all windows
  mainwindow.on('closed', () => {
    app.quit();
  });

  //build menu from template
  const mainMenu = Menu.buildFromTemplate(v_menu);
  //insert menu

  Menu.setApplicationMenu(mainMenu);
};

// const createWindow = () => {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//   });

  // and load the index.html of the app.
//   mainWindow.loadFile(path.join(__dirname, 'index.html'));
//
//   // Open the DevTools.
//   mainWindow.webContents.openDevTools();
// };

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createMainWindow(mainMenuTemplate);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow(mainMenuTemplate);
  }
});

// if mac add empty object to menu
if(process.platform == 'darwin') {
  mainMenuTemplate.unshift({});
}

//add development tools item if not in production
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I': 'Ctrl+I', //Acceloretor adds hot keys
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]})
}

//catch tag add
ipcMain.on('update:tags', async (e, res) => {
  console.log(`Hitting the main.js page, data is ${res}`);
  await tagWindow( (err, window) => {
    setTimeout(() => {
      window.webContents.send('update:tags', res);
    }, 1000);
  });
});




// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
