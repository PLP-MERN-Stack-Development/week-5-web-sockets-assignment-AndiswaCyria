import  { useState, useRef, useEffect } from 'react';
import { Send, Users, Circle, MessageCircle, User, ArrowLeft, Hash, Lock } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';
import PrivateChat from './PrivateChat.jsx';

const ChatRoom = ({
  messages,
  onlineUsers,
  typingUsers,
  currentUser,
  isConnected,
  privateChats,
  activePrivateChat,
  onSendMessage,
  onSendPrivateMessage,
  onStartTyping,
  onStopTyping,
  onStartPrivateChat,
  onSetActivePrivateChat,
  onAddReaction,
  onRemoveReaction
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePrivateChat, privateChats]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activePrivateChat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      if (activePrivateChat) {
        onSendPrivateMessage(activePrivateChat, inputMessage.trim());
        onStopTyping(true, activePrivateChat);
      } else {
        onSendMessage(inputMessage.trim());
        onStopTyping(false);
      }
      setInputMessage('');
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (e.target.value.trim()) {
      if (activePrivateChat) {
        onStartTyping(true, activePrivateChat);
      } else {
        onStartTyping(false);
      }
    } else {
      if (activePrivateChat) {
        onStopTyping(true, activePrivateChat);
      } else {
        onStopTyping(false);
      }
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserColor = (username) => {
    if (!username || typeof username !== 'string') return 'bg-gray-500';
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-gray-500'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const currentMessages = activePrivateChat 
    ? privateChats[activePrivateChat]?.messages || []
    : messages;

  const currentTypingUsers = activePrivateChat
    ? (privateChats[activePrivateChat]?.isTyping ? [activePrivateChat] : [])
    : typingUsers;

  if (activePrivateChat) {
    return (
      <PrivateChat
        chatUser={activePrivateChat}
        messages={currentMessages}
        currentUser={currentUser}
        isConnected={isConnected}
        isTyping={privateChats[activePrivateChat]?.isTyping || false}
        onSendMessage={(message) => onSendPrivateMessage(activePrivateChat, message)}
        onStartTyping={() => onStartTyping(true, activePrivateChat)}
        onStopTyping={() => onStopTyping(true, activePrivateChat)}
        onBack={() => onSetActivePrivateChat(null)}
        onAddReaction={(messageId, emoji) => onAddReaction(messageId, emoji, true, activePrivateChat)}
        onRemoveReaction={(messageId, emoji) => onRemoveReaction(messageId, emoji, true, activePrivateChat)}
        getUserColor={getUserColor}
        formatTime={formatTime}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Sidebar */}
      <div className={`${showUsers ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white/80 backdrop-blur-sm border-r border-white/20 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-500" />
            Online Users ({onlineUsers.length})
          </h2>
          <button
            onClick={() => setShowUsers(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-2">
          {onlineUsers.map((user) => (
            <div
              key={user.id || user.username || Math.random()}
              className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors cursor-pointer"
              onClick={() => user.username && user.username !== currentUser && onStartPrivateChat(user.username)}
            >
              <div className={`w-8 h-8 rounded-full ${getUserColor(user.username || "Unknown")} flex items-center justify-center`}>
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800">
                    {user.username}
                    {user.username === currentUser && (
                      <span className="text-xs text-gray-500 ml-1">(You)</span>
                    )}
                  </span>
                  <Circle className="h-2 w-2 text-green-500 fill-current" />
                </div>
                {privateChats[user.username]?.messages?.length > 0 && user.username !== currentUser && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Lock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Private chat</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowUsers(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Users className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <Hash className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-800">Global Chat</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Circle className={`h-3 w-3 ${isConnected ? 'text-green-500' : 'text-red-500'} fill-current`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                username: message.username || message.from || "System"
              }}
              currentUser={currentUser}
              getUserColor={getUserColor}
              formatTime={formatTime}
              onAddReaction={(emoji) => onAddReaction(message.id, emoji, false)}
              onRemoveReaction={(emoji) => onRemoveReaction(message.id, emoji, false)}
            />
          ))}
          
          {/* Typing Indicator */}
          {currentTypingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                  <span className="text-xs text-gray-600">
                    {currentTypingUsers.join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-white/20 p-4 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {showUsers && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowUsers(false)}
        />
      )}
    </div>
  );
};

export default ChatRoom;