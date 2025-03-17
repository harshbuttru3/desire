import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const MessageList = ({ messages, room }) => {
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Select a room to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => (
        <div
          key={message._id}
          className={`flex ${
            message.sender._id === user.id ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`message ${
              message.sender._id === user.id ? 'message-sent' : 'message-received'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">
                {message.sender.username}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
            </div>

            <div className="text-sm whitespace-pre-wrap">{message.content}</div>

            {message.edited && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                edited
              </span>
            )}

            {message.reactions && message.reactions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {message.reactions.map((reaction, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full"
                  >
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 