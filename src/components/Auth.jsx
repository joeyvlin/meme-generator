import { useState } from 'react';
import { auth } from '../config/instantdb';
import './Auth.css';

export default function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await auth.sendMagicLink({ email });
      setMessage('Check your email for the magic link!');
    } catch (error) {
      console.error('Error sending magic link:', error);
      setMessage('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-content">
        <h2>Sign In to Vote</h2>
        <p>You need to sign in to vote on memes. We'll send you a magic link to your email.</p>
        <form onSubmit={handleSignIn}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="auth-email-input"
          />
          <button type="submit" disabled={isLoading} className="auth-submit-button">
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}
        <button onClick={onAuthSuccess} className="auth-cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
}

