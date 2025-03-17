import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [error, setError] = useState('');
  const { login, loginAsGuest, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isGuestMode) {
        await loginAsGuest(guestUsername);
      } else {
        await login(email, password);
      }
      navigate('/chat');
    } catch (error) {
      setError(error.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isGuestMode ? 'Join as Guest' : 'Login'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isGuestMode ? (
            <div>
              <label htmlFor="guestUsername" className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                id="guestUsername"
                value={guestUsername}
                onChange={(e) => setGuestUsername(e.target.value)}
                className="input"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-full">
            {isGuestMode ? 'Join Chat' : 'Login'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsGuestMode(!isGuestMode)}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {isGuestMode
                ? 'Already have an account? Login'
                : 'Want to try it out? Join as Guest'}
            </button>
          </div>
        </form>

        {!isGuestMode && (
          <p className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login; 