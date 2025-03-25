import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from '../utils/axios';
import RoomList from '../components/chat/RoomList';
import ChatComponent from '../components/chat/Chat';
import { useAuth } from '../contexts/AuthContext';

// Constants for localStorage
const MESSAGE_CACHE_KEY = 'chat_message_cache';
const MESSAGE_CACHE_TIMESTAMP = 'chat_message_cache_timestamp';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Message cache to persist messages between room changes and page reloads
  const [messageCache, setMessageCache] = useState(() => {
    // Initialize from localStorage if available and not expired
    try {
      const cachedData = localStorage.getItem(MESSAGE_CACHE_KEY);
      const timestamp = localStorage.getItem(MESSAGE_CACHE_TIMESTAMP);
      
      if (cachedData && timestamp) {
        const now = Date.now();
        const cacheTime = parseInt(timestamp, 10);
        
        // Only use cache if it's less than 10 minutes old
        if (now - cacheTime < CACHE_TTL) {
          return JSON.parse(cachedData);
        }
      }
    } catch (error) {
      console.error('Error loading message cache from localStorage', error);
    }
    
    return {};
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Save message cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(MESSAGE_CACHE_KEY, JSON.stringify(messageCache));
      localStorage.setItem(MESSAGE_CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Error saving message cache to localStorage', error);
    }
  }, [messageCache]);

  // Fetch messages for the selected room
  const fetchMessages = useCallback(async (roomId) => {
    try {
      const response = await axios.get(`/api/messages`, {
        params: { roomId }
      });
      
      if (response.data && response.data.length > 0) {
        // Update the cache with fetched messages
        setMessageCache(prev => ({
          ...prev,
          [roomId]: response.data.reverse()
        }));
        return response.data.reverse();
      } 
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, []);

  // Add a message to the cache
  const addMessageToCache = useCallback((roomId, message) => {
    setMessageCache(prev => {
      const roomMessages = prev[roomId] || [];
      // Check if message already exists to avoid duplicates
      if (!roomMessages.some(msg => msg._id === message._id)) {
        return {
          ...prev,
          [roomId]: [...roomMessages, message]
        };
      }
      return prev;
    });
  }, []);

  // Update a message in the cache
  const updateMessageInCache = useCallback((roomId, editedMessage) => {
    setMessageCache(prev => {
      const roomMessages = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: roomMessages.map(msg => 
          msg._id === editedMessage._id ? editedMessage : msg
        )
      };
    });
  }, []);

  // Remove a message from the cache
  const removeMessageFromCache = useCallback((roomId, messageId) => {
    setMessageCache(prev => {
      const roomMessages = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: roomMessages.filter(msg => msg._id !== messageId)
      };
    });
  }, []);

  // Clean expired messages from cache
  const cleanExpiredMessages = useCallback(() => {
    const now = new Date();
    
    setMessageCache(prev => {
      const newCache = { ...prev };
      
      // Check each room's messages
      Object.keys(newCache).forEach(roomId => {
        const roomMessages = newCache[roomId];
        if (roomMessages && roomMessages.length > 0) {
          // Filter out messages that have expired
          newCache[roomId] = roomMessages.filter(msg => {
            if (!msg.expiresAt) return true;
            return new Date(msg.expiresAt) > now;
          });
        }
      });
      
      return newCache;
    });
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const socketUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setLoading(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to chat server');
      setLoading(false);
    });

    setSocket(newSocket);

    // Clean expired messages when component mounts
    cleanExpiredMessages();
    
    // Set up interval to clean expired messages every minute
    const cleanupInterval = setInterval(cleanExpiredMessages, 60000);

    return () => {
      newSocket.close();
      clearInterval(cleanupInterval);
    };
  }, [user, navigate, cleanExpiredMessages]);

  // Socket event listeners for messages
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message', (newMessage) => {
      addMessageToCache(newMessage.room, newMessage);
    });

    // Listen for edited messages
    socket.on('message_edited', (editedMessage) => {
      updateMessageInCache(editedMessage.room, editedMessage);
    });

    // Listen for deleted messages
    socket.on('message_deleted', (messageId) => {
      // Note: We would need the roomId here as well to properly remove from cache
      if (selectedRoom) {
        removeMessageFromCache(selectedRoom._id, messageId);
      }
    });

    return () => {
      socket.off('message');
      socket.off('message_edited');
      socket.off('message_deleted');
    };
  }, [socket, selectedRoom, addMessageToCache, updateMessageInCache, removeMessageFromCache]);

  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    
    if (socket) {
      socket.emit('join_room', room._id);
    }
    
    // If we don't have messages for this room in cache, fetch them
    if (!messageCache[room._id] || messageCache[room._id].length === 0) {
      await fetchMessages(room._id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="w-1/4 border-r dark:border-gray-700">
        <RoomList
          onSelectRoom={handleSelectRoom}
          selectedRoomId={selectedRoom?._id}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatComponent 
          selectedRoom={selectedRoom} 
          socket={socket} 
          messages={selectedRoom ? messageCache[selectedRoom._id] || [] : []}
          onSendMessage={(content) => {
            if (socket && selectedRoom) {
              socket.emit('message', {
                roomId: selectedRoom._id,
                content: content.trim(),
                type: 'text'
              });
            }
          }}
          fetchMessages={() => selectedRoom && fetchMessages(selectedRoom._id)}
        />
      </div>
    </div>
  );
};

export default Chat; 