
const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http');

const app = express();
const server = createServer(app);

// CORS configuration for Vercel
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = [];
const botName = "ViceChat Bot";

function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

function formatMessage(username, text) {
  return {
    username,
    text,
    time: new Date().toLocaleTimeString()
  };
}

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    socket.emit('message', formatMessage(botName, 'Welcome to ViceChat!'));
    socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    }
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    res.socket.server.io = io;
  }
  res.end();
};
