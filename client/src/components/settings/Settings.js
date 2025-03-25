import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../utils/axios';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    notifications: user?.notifications || {},
    language: user?.language || 'en',
    timezone: user?.timezone || 'UTC'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      setError('User not authenticated');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const response = await axios.patch(`/api/users/${user._id}`, formData);
      setUser(response.data);
      setSuccess('Settings updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update settings';
      setError(errorMessage);
      console.error('Error updating settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!user) {
    return (
      <div className="p-4 text-red-600">
        Please log in to access settings
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">User Settings</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Language
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="input"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Timezone
          </label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="input"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">India (IST)</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Settings; 