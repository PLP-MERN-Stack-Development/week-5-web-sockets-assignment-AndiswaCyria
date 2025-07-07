import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store connected users and messages
const users = new Map();
const typingUsers = new Set();
const messages = [];
const privateMessages = new Map(); // Store private messages by user pairs

// Helper function to get private chat key
const getPrivateChatKey = (user1, user2) => {
  return [user1, user2].sort().join('-');
};

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist', 'index.html'));
  });
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join', (username) => {
    users.set(socket.id, {
      id: socket.id,
      username: username,
      joinedAt: new Date()
    });

    // Notify all users about the new user
    socket.broadcast.emit('user-joined', {
      username: username,
      timestamp: new Date()
    });

    // Send current online users to the new user
    const onlineUsers = Array.from(users.values());
    socket.emit('online-users', onlineUsers);
    
    // Broadcast updated user list to all users
    io.emit('users-updated', onlineUsers);
  });

  // Handle new messages
  socket.on('message', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const messageData = {
        id: Date.now() + Math.random(),
        from: user.username,
        message: data.message,
        timestamp: new Date(),
        reactions: {}
      };
      messages.push(messageData);
      console.log('Broadcasting message:', messageData); // <--- Add this
      io.emit('message', messageData);
    }
  });

  // Handle private messages
  socket.on('private-message', (data) => {
    const user = users.get(socket.id);
    if (user && data.to && data.message) {
      const messageData = {
        id: Date.now() + Math.random(),
        from: user.username, // <--- use 'from' everywhere
        to: data.to,
        message: data.message,
        timestamp: new Date(),
        reactions: {}
      };

      // Store private message
      const chatKey = getPrivateChatKey(user.username, data.to);
      if (!privateMessages.has(chatKey)) {
        privateMessages.set(chatKey, []);
      }
      privateMessages.get(chatKey).push(messageData);

      // Find the recipient's socket
      const recipientSocket = Array.from(users.entries())
        .find(([_, userData]) => userData.username === data.to);

      if (recipientSocket) {
        // Send to recipient
        io.to(recipientSocket[0]).emit('private-message', messageData);
      }
    }
  });

  // Handle message reactions
  socket.on('add-reaction', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const { messageId, emoji, isPrivate, chatUser } = data;
      
      if (isPrivate && chatUser) {
        // Handle private message reaction
        const chatKey = getPrivateChatKey(user.username, chatUser);
        const chatMessages = privateMessages.get(chatKey);
        
        if (chatMessages) {
          const message = chatMessages.find(msg => msg.id === messageId);
          if (message) {
            // When adding a reaction
            if (!message.reactions[emoji]) message.reactions[emoji] = [];
            if (!message.reactions[emoji].includes(user.username)) {
              message.reactions[emoji].push(user.username);
            }

            // Send reaction update to both users
            const recipientSocket = Array.from(users.entries())
              .find(([_, userData]) => userData.username === chatUser);

            const reactionData = {
              messageId,
              reactions: message.reactions,
              isPrivate: true,
              from: user.username,
              to: chatUser
            };

            socket.emit('message-reaction', reactionData);
            if (recipientSocket) {
              io.to(recipientSocket[0]).emit('message-reaction', reactionData);
            }
          }
        }
      } else {
        // Handle public message reaction
        const message = messages.find(msg => msg.id === messageId);
        if (message) {
          // When adding a reaction
          if (!message.reactions[emoji]) message.reactions[emoji] = [];
          if (!message.reactions[emoji].includes(user.username)) {
            message.reactions[emoji].push(user.username);
          }

          // Broadcast reaction update to all users
          io.emit('message-reaction', {
            messageId: message.id,
            reactions: message.reactions,
            isPrivate: false, // or true for private
            from: message.from,
            to: message.to
          });
        }
      }
    }
  });

  // Handle remove reaction
  socket.on('remove-reaction', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const { messageId, emoji, isPrivate, chatUser } = data;
      
      if (isPrivate && chatUser) {
        // Handle private message reaction removal
        const chatKey = getPrivateChatKey(user.username, chatUser);
        const chatMessages = privateMessages.get(chatKey);
        
        if (chatMessages) {
          const message = chatMessages.find(msg => msg.id === messageId);
          if (message && message.reactions[emoji]) {
            // When removing a reaction
            message.reactions[emoji] = message.reactions[emoji].filter(u => u !== user.username);
            if (message.reactions[emoji].length === 0) delete message.reactions[emoji];

            // Send reaction update to both users
            const recipientSocket = Array.from(users.entries())
              .find(([_, userData]) => userData.username === chatUser);

            const reactionData = {
              messageId,
              reactions: message.reactions,
              isPrivate: true,
              from: user.username,
              to: chatUser
            };

            socket.emit('message-reaction', reactionData);
            if (recipientSocket) {
              io.to(recipientSocket[0]).emit('message-reaction', reactionData);
            }
          }
        }
      } else {
        // Handle public message reaction removal
        const message = messages.find(msg => msg.id === messageId);
        if (message && message.reactions[emoji]) {
          // When removing a reaction
          message.reactions[emoji] = message.reactions[emoji].filter(u => u !== user.username);
          if (message.reactions[emoji].length === 0) delete message.reactions[emoji];

          // Broadcast reaction update to all users
          io.emit('message-reaction', {
            messageId: message.id,
            reactions: message.reactions,
            isPrivate: false, // or true for private
            from: message.from,
            to: message.to
          });
        }
      }
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user) {
      if (data.isTyping) {
        typingUsers.add(user.username);
      } else {
        typingUsers.delete(user.username);
      }
      
      // Broadcast typing status to all other users
      socket.broadcast.emit('typing', {
        username: user.username,
        isTyping: data.isTyping,
        typingUsers: Array.from(typingUsers)
      });
    }
  });

  // Handle private typing indicators
  socket.on('private-typing', (data) => {
    const user = users.get(socket.id);
    if (user && data.to) {
      // Find the recipient's socket
      const recipientSocket = Array.from(users.entries())
        .find(([_, userData]) => userData.username === data.to);

      if (recipientSocket) {
        // Send typing indicator to recipient
        io.to(recipientSocket[0]).emit('private-typing', {
          from: user.username,
          isTyping: data.isTyping
        });
      }
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Remove from typing users
      typingUsers.delete(user.username);
      
      // Remove from users list
      users.delete(socket.id);
      
      // Notify all users about the disconnection
      socket.broadcast.emit('user-left', {
        username: user.username,
        timestamp: new Date()
      });
      
      // Broadcast updated user list
      const onlineUsers = Array.from(users.values());
      io.emit('users-updated', onlineUsers);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});