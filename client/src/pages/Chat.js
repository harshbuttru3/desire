import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import RoomList from '../components/chat/RoomList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import { useAuth } from '../contexts/AuthContext';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const newSocket = io(process.env.REACT_APP_API_URL, {
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

    newSocket.on('message', (message) => {
      if (selectedRoom && message.roomId === selectedRoom._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('message_edited', (message) => {
      if (selectedRoom && message.roomId === selectedRoom._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === message._id ? message : msg
        ));
      }
    });

    newSocket.on('message_deleted', (messageId) => {
      if (selectedRoom) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, navigate, selectedRoom]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setError('Failed to fetch chat rooms');
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedRoom) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/messages/${selectedRoom._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to fetch messages');
      }
    };

    fetchMessages();
  }, [selectedRoom]);

  const handleSendMessage = async (content) => {
    if (!selectedRoom || !socket) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/messages`,
        {
          roomId: selectedRoom._id,
          content
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      socket.emit('message', response.data);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId, content) => {
    if (!socket) return;

    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/messages/${messageId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      socket.emit('message_edited', response.data);
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!socket) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      socket.emit('message_deleted', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
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
    <div className="flex h-screen">
      <div className="w-1/4 border-r dark:border-gray-700">
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
        />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold">{selectedRoom.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedRoom.isPrivate ? 'Private Room' : 'Public Room'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessageList
                messages={messages}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
              />
            </div>
            <MessageInput onSendMessage={handleSendMessage} room={selectedRoom} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Select a room to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 