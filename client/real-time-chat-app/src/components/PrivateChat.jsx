import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Lock, Circle } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';

const PrivateChat = ({
  chatUser,
  messages,
  currentUser,
  isConnected,
  isTyping,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onBack,
  onAddReaction,
  onRemoveReaction,
  getUserColor,
  formatTime
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      onStopTyping();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (e.target.value.trim()) {
      onStartTyping();
    } else {
      onStopTyping();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className={`w-8 h-8 rounded-full ${getUserColor(chatUser)} flex items-center justify-center`}>
              <span className="text-white font-medium text-sm">
                {chatUser.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <h1 className="text-lg font-bold text-gray-800">{chatUser}</h1>
              </div>
              <p className="text-xs text-gray-500">Private conversation</p>
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
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Start your private conversation with {chatUser}</p>
              <p className="text-sm mt-1">Messages are end-to-end encrypted</p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                username: message.from === currentUser ? currentUser : message.from
              }}
              currentUser={currentUser}
              getUserColor={getUserColor}
              formatTime={formatTime}
              onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
              onRemoveReaction={(emoji) => onRemoveReaction(message.id, emoji)}
            />
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                  <span className="text-xs text-gray-600">
                    {chatUser} is typing...
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
              placeholder={`Message ${chatUser}...`}
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
    </div>
  );
};

export default PrivateChat;