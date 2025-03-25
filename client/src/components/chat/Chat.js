import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MessageInput from './MessageInput';

const Chat = ({ selectedRoom, socket, messages = [], onSendMessage, fetchMessages }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const initialLoadRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages when room changes or if we have no messages
  useEffect(() => {
    if (selectedRoom?._id) {
      if (!messages || messages.length === 0) {
        setLoading(true);
        fetchMessages()
          .then(() => {
            setLoading(false);
            initialLoadRef.current = true;
          })
          .catch(error => {
            console.error('Error fetching messages:', error);
            setError('Failed to fetch messages');
            setLoading(false);
          });
      } else if (!initialLoadRef.current) {
        initialLoadRef.current = true;
      }
    }
  }, [selectedRoom?._id, messages, fetchMessages]);

  // Reset the initialLoad flag when room changes
  useEffect(() => {
    initialLoadRef.current = false;
  }, [selectedRoom?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter out expired messages from the display
  const activeMessages = messages.filter(msg => {
    if (!msg.expiresAt) return true;
    return new Date(msg.expiresAt) > new Date();
  });

  const handleSendMessage = async (content) => {
    if (!content || !content.trim()) {
      setError('Message cannot be empty');
      return;
    }
    
    try {
      setSendingMessage(true);
      setError('');
      
      onSendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a room to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
        <p className="text-sm text-gray-500">{selectedRoom.description}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Be the first to send a message!
          </div>
        ) : (
          activeMessages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender._id === user._id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender._id === user._id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {message.sender._id !== user._id && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {message.sender.username}
                  </div>
                )}
                <div>{message.content}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={loading || sendingMessage || !selectedRoom}
      />
    </div>
  );
};

export default Chat; 