document.getElementById('browse').addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) document.getElementById('folder').value = folder;
    window.electronAPI.setFolder(folder);
  });
  
  document.getElementById('start').addEventListener('click', () => {
    const interval = parseInt(document.getElementById('interval').value) * 1000;
    const format = document.getElementById('format').value;
    const folder = document.getElementById('folder').value || ''; // empty string bhej

  
    window.electronAPI.startCapturing({ interval, format, folder });
  });
  
  document.getElementById('stop').addEventListener('click', () => {
    window.electronAPI.stopCapturing();
  });


  document.getElementById('login').addEventListener('click', async () => {
    const password = document.getElementById('password').value;
    const correct = await window.electronAPI.checkPassword(password);
  
    if (correct) {
      // Hide login, show app
      document.getElementById('auth').style.display = 'none';
      document.querySelector('.container').style.display = 'block';
    } else {
      alert('Incorrect password!');
    }
  });

window.electronAPI.onScreenshotTaken((filepath) => {
  // Show Notification
  const notif = document.createElement('div');
  notif.classList.add('notification');
  notif.innerText = `📸 Screenshot saved: ${filepath}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);

  // Append to recent screenshots with clickable link
  const recent = document.getElementById('recentList');
  const li = document.createElement('li');
  li.classList.add('screenshot-item');
  li.textContent = filepath.split('\\').pop(); // just the filename

  li.style.cursor = 'pointer';
  li.title = 'Click to open';

  // On click, open the screenshot
  li.addEventListener('click', () => {
    window.electronAPI.openFile(filepath);
  });

  recent.prepend(li);
});

