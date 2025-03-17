import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/24/outline';

const RoomList = ({ onSelectRoom, selectedRoomId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    isPrivate: false,
    password: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      setError('Failed to fetch rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await axios.post('/api/rooms', newRoom);
      setRooms(prev => [...prev, response.data]);
      setShowCreateModal(false);
      setNewRoom({
        name: '',
        description: '',
        isPrivate: false,
        password: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create room';
      setError(errorMessage);
      console.error('Error creating room:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">Chat Rooms</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {rooms.map(room => (
          <button
            key={room._id}
            onClick={() => onSelectRoom(room)}
            className={`w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
              selectedRoomId === room._id
                ? 'bg-gray-100 dark:bg-gray-700'
                : ''
            }`}
          >
            <h3 className="font-medium">{room.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {room.description}
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span>{room.members.length} members</span>
              {room.isPrivate && (
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                  Private
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={e => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={e => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows="3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newRoom.isPrivate}
                  onChange={e => setNewRoom(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <label htmlFor="isPrivate" className="ml-2 text-sm">
                  Private Room
                </label>
              </div>

              {newRoom.isPrivate && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newRoom.password}
                    onChange={e => setNewRoom(prev => ({ ...prev, password: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList; 