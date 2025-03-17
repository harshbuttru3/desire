const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await axios.patch(`/api/users/${user._id}`, formData);
      setUser(response.data);
      setSuccess('Settings updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update settings';
      setError(errorMessage);
      console.error('Error updating settings:', error);
    }
  }; 