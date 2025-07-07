import React, { useState } from 'react';
import { Smile } from 'lucide-react';


const MessageBubble = ({ 
  message, 
  currentUser, 
  getUserColor, 
  formatTime, 
  onAddReaction, 
  onRemoveReaction 
}) => {
  const [showReactions, setShowReactions] = useState(false);
  
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];
  
  const handleReactionClick = (emoji) => {
    const userReactions = message.reactions?.[emoji] || [];
    const hasReacted = userReactions.includes(currentUser);
    
    if (hasReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowReactions(false);
  };

  const getReactionCount = (emoji) => {
    return message.reactions?.[emoji]?.length || 0;
  };

  const hasUserReacted = (emoji) => {
    return message.reactions?.[emoji]?.includes(currentUser) || false;
  };

  return (
    <div
      className={`flex ${message.username === currentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="relative group max-w-xs lg:max-w-md">
        <div
          className={`px-4 py-2 rounded-2xl ${
            message.username === currentUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : message.username === 'System'
              ? 'bg-gray-200 text-gray-700 text-center mx-auto'
              : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/20'
          }`}
        >
          {message.username !== currentUser && message.username !== 'System' && (
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-4 h-4 rounded-full ${getUserColor(message.username)}`} />
              <span className="text-xs font-medium text-gray-600">{message.username}</span>
            </div>
          )}
          <p className={`text-sm ${message.username === 'System' ? 'italic' : ''}`}>
            {message.message}
          </p>
          <p className={`text-xs mt-1 ${
            message.username === currentUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>

        {/* Reaction Button */}
        {message.username !== 'System' && (
          <div className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="bg-white border border-gray-300 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
              
              {/* Reaction Picker */}
              {showReactions && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10">
                  {reactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReactionClick(emoji)}
                      className="hover:bg-gray-100 rounded p-1 transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reaction Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                    hasUserReacted(emoji)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{getReactionCount(emoji)}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;