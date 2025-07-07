import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (serverUrl) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [privateChats, setPrivateChats] = useState({});
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const newSocket = io();
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('message', (data) => {
      console.log('Received message from server:', data); // <--- Add this
      setMessages(prev => [...prev, { ...data, timestamp: new Date(data.timestamp) }]);
    });

    newSocket.on('private-message', (data) => {
      const chatKey = data.from === currentUser ? data.to : data.from;
      setPrivateChats(prev => ({
        ...prev,
        [chatKey]: {
          ...prev[chatKey],
          messages: [...(prev[chatKey]?.messages || []), {
            ...data,
            timestamp: new Date(data.timestamp)
          }]
        }
      }));
    });

    newSocket.on('message-reaction', (data) => {
      if (data.isPrivate) {
        const chatKey = data.from === currentUser ? data.to : data.from;
        setPrivateChats(prev => ({
          ...prev,
          [chatKey]: {
            ...prev[chatKey],
            messages: prev[chatKey]?.messages?.map(msg =>
              msg.id === data.messageId
                ? { ...msg, reactions: data.reactions }
                : msg
            ) || []
          }
        }));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        ));
      }
    });

    newSocket.on('user-joined', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: `${data.username} joined the chat`,
        timestamp: new Date(data.timestamp),
        reactions: {}
      }]);
    });

    newSocket.on('user-left', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: `${data.username} left the chat`,
        timestamp: new Date(data.timestamp),
        reactions: {}
      }]);
    });

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users.map(user => ({
        ...user,
        joinedAt: new Date(user.joinedAt)
      })));
    });

    newSocket.on('users-updated', (users) => {
      setOnlineUsers(users.map(user => ({
        ...user,
        joinedAt: new Date(user.joinedAt)
      })));
    });

    newSocket.on('typing', (data) => {
      setTypingUsers(data.typingUsers);
    });

    newSocket.on('private-typing', (data) => {
      const chatKey = data.from;
      setPrivateChats(prev => ({
        ...prev,
        [chatKey]: {
          ...prev[chatKey],
          isTyping: data.isTyping
        }
      }));
    });

    return () => {
      newSocket.close();
    };
  }, []); // <--- Only run once!

  const joinChat = (username) => {
    if (socket && username.trim()) {
      setCurrentUser(username);
      socket.emit('join', username);
    }
  };

  const sendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('message', { message });
    }
  };

  const sendPrivateMessage = (to, message) => {
    if (socket && message.trim() && to) {
      socket.emit('private-message', { to, message });
      
      // Add message to local state immediately
      setPrivateChats(prev => ({
        ...prev,
        [to]: {
          ...prev[to],
          messages: [...(prev[to]?.messages || []), {
            id: Date.now(),
            from: currentUser,
            to: to,
            message: message,
            timestamp: new Date(),
            reactions: {}
          }]
        }
      }));
    }
  };

  const startTyping = (isPrivate = false, to = null) => {
    if (socket) {
      if (isPrivate && to) {
        socket.emit('private-typing', { to, isTyping: true });
      } else {
        socket.emit('typing', { isTyping: true });
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(isPrivate, to);
      }, 2000);
    }
  };

  const stopTyping = (isPrivate = false, to = null) => {
    if (socket) {
      if (isPrivate && to) {
        socket.emit('private-typing', { to, isTyping: false });
      } else {
        socket.emit('typing', { isTyping: false });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const startPrivateChat = (username) => {
    if (username !== currentUser) {
      setPrivateChats(prev => ({
        ...prev,
        [username]: {
          ...prev[username],
          messages: prev[username]?.messages || []
        }
      }));
      setActivePrivateChat(username);
    }
  };

  const addReaction = (messageId, emoji, isPrivate = false, chatUser = null) => {
    if (socket) {
      socket.emit('add-reaction', {
        messageId,
        emoji,
        isPrivate,
        chatUser
      });
    }
  };

  const removeReaction = (messageId, emoji, isPrivate = false, chatUser = null) => {
    if (socket) {
      socket.emit('remove-reaction', {
        messageId,
        emoji,
        isPrivate,
        chatUser
      });
    }
  };

  return {
    socket,
    isConnected,
    messages,
    onlineUsers,
    typingUsers,
    currentUser,
    privateChats,
    activePrivateChat,
    joinChat,
    sendMessage,
    sendPrivateMessage,
    startTyping,
    stopTyping,
    startPrivateChat,
    setActivePrivateChat,
    addReaction,
    removeReaction
  };
};

export default useSocket;