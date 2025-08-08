const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const fileInput = document.getElementById('file-input');
const fileBtn = document.getElementById('file-btn');

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io({
  path: '/api/socket'
});

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// File message from server
socket.on('fileMessage', (fileData) => {
  console.log(fileData);
  outputFileMessage(fileData);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

// Output file message to DOM
function outputFileMessage(fileData) {
  const div = document.createElement('div');
  div.classList.add('message', 'file-message');
  
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = fileData.username;
  p.innerHTML += `<span>${fileData.time}</span>`;
  div.appendChild(p);
  
  const fileDiv = document.createElement('div');
  fileDiv.classList.add('file-content');
  
  const fileIcon = document.createElement('i');
  fileIcon.classList.add('fas', 'fa-file');
  
  const fileInfo = document.createElement('div');
  fileInfo.classList.add('file-info');
  
  const fileName = document.createElement('span');
  fileName.classList.add('file-name');
  fileName.innerText = fileData.filename;
  
  const fileSize = document.createElement('span');
  fileSize.classList.add('file-size');
  fileSize.innerText = ` (${formatFileSize(fileData.fileSize)})`;
  
  const downloadBtn = document.createElement('a');
  downloadBtn.href = fileData.fileUrl;
  downloadBtn.classList.add('download-btn');
  downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
  downloadBtn.download = fileData.filename;
  
  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);
  fileDiv.appendChild(fileIcon);
  fileDiv.appendChild(fileInfo);
  fileDiv.appendChild(downloadBtn);
  div.appendChild(fileDiv);
  
  document.querySelector('.chat-messages').appendChild(div);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File upload functionality
fileBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const fileData = await response.json();
      socket.emit('fileShared', fileData);
    } else {
      alert('Failed to upload file');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Error uploading file');
  }

  // Clear file input
  fileInput.value = '';
});

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    window.location = '../index.html';
  } else {
  }
});
