import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import {
  ChatBubbleLeftIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMessages: 0,
    roomsJoined: 0,
    lastActive: null
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/${username}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setUser(response.data);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserStats = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/${username}/stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    };

    fetchUserProfile();
    fetchUserStats();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100 rounded-lg">
            User not found
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-gray-500 dark:text-gray-400" />
            </div>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <ChatBubbleLeftIcon className="w-6 h-6 text-primary-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
              <p className="text-2xl font-bold">{stats.totalMessages}</p>
            </div>
          </div>
          <div className="stat-card">
            <UserGroupIcon className="w-6 h-6 text-primary-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rooms</p>
              <p className="text-2xl font-bold">{stats.roomsJoined}</p>
            </div>
          </div>
          <div className="stat-card">
            <ClockIcon className="w-6 h-6 text-primary-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
              <p className="text-2xl font-bold">
                {stats.lastActive ? format(new Date(stats.lastActive), 'MMM d, yyyy') : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="info-card">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
            </div>
            <div className="info-card">
              <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account Type</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>
            <div className="info-card">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                <p className="font-medium">
                  {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="info-card">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
                <p className="font-medium">
                  {user.lastActive ? format(new Date(user.lastActive), 'MMM d, yyyy HH:mm') : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwnProfile && (
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => window.location.href = '/settings'}
              className="btn btn-secondary"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 