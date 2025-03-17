import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import {
  UserCircleIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMessages: 0,
    roomsJoined: 0,
    lastActive: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setStats(response.data);
      } catch (error) {
        setError('Failed to fetch user statistics');
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.id]);

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
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <UserCircleIcon className="h-24 w-24 text-gray-400" />
            <button className="absolute bottom-0 right-0 p-1 bg-primary-600 text-white rounded-full hover:bg-primary-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftIcon className="h-5 w-5 text-primary-600" />
              <span className="font-medium">Messages</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalMessages}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              <span className="font-medium">Rooms</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.roomsJoined}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-primary-600" />
              <span className="font-medium">Last Active</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {stats.lastActive ? format(new Date(stats.lastActive), 'MMM d, yyyy') : 'Never'}
            </p>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-6">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={user.username}
                readOnly
                className="input bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="input bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <input
                type="text"
                value={user.isGuest ? 'Guest Account' : 'Registered Account'}
                readOnly
                className="input bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Member Since</label>
              <input
                type="text"
                value={format(new Date(user.createdAt), 'MMMM d, yyyy')}
                readOnly
                className="input bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 