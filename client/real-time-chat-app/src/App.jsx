import React, { useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import ChatRoom from './components/ChatRoom.jsx';
import MessageBubble from './components/MessageBubble.jsx';
import PrivateChat from './components/PrivateChat.jsx';
import { useSocket } from './hooks/useSocket.js';

const SERVER_URL = 'http://localhost:5000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const {
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
  } = useSocket(SERVER_URL);

  const handleJoin = (username) => {
    joinChat(username);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginForm onJoin={handleJoin} />;
  }

  console.log("messages", messages);
  console.log("privateChats", privateChats);

  return (
    <>
      <ChatRoom
        isConnected={isConnected}
        messages={messages}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        currentUser={currentUser}
        privateChats={privateChats}
        activePrivateChat={activePrivateChat}
        onSendMessage={sendMessage}
        onSendPrivateMessage={sendPrivateMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        onStartPrivateChat={startPrivateChat}
        onSetActivePrivateChat={setActivePrivateChat}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
      />
      {/* If a private chat is active, render the PrivateChat component */}
      {activePrivateChat && (
        <PrivateChat
          chatUser={activePrivateChat}
          messages={privateChats[activePrivateChat]?.messages || []}
          currentUser={currentUser}
          isConnected={isConnected}
          isTyping={typingUsers[activePrivateChat] || false}
          onSendMessage={sendPrivateMessage}
          onStartTyping={() => startTyping(true, activePrivateChat)}
          onStopTyping={() => stopTyping(true, activePrivateChat)}
          onBack={() => setActivePrivateChat(null)}
          onAddReaction={(messageId, emoji) => addReaction(messageId, emoji, true, activePrivateChat)}
          onRemoveReaction={(messageId, emoji) => removeReaction(messageId, emoji, true, activePrivateChat)}
          getUserColor={(user) => {
            const colors = [
              'bg-blue-500', 'bg-green-500', 'bg-purple-500',
              'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500',
              'bg-red-500', 'bg-gray-500'
            ];
            const index = user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colors[index % colors.length];
          }}
          formatTime={(date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />
      )}
      {/* Render the MessageBubble component for each message */}
      {messages.map((message) => (
        <React.Fragment key={message.id}>
          <MessageBubble
            message={{
              ...message,
              username: message.from === currentUser ? currentUser : message.from
            }}
            currentUser={currentUser}
            getUserColor={(user) => {
              const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500',
                'bg-red-500', 'bg-gray-500'
              ];
              const index = user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              return colors[index % colors.length];
            }}
            formatTime={(date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            onAddReaction={(emoji) => addReaction(message.id, emoji)}
            onRemoveReaction={(emoji) => removeReaction(message.id, emoji)}
          />
          <br />
        </React.Fragment>
      ))}
    </>
  );
}

export default App;