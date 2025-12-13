import { useState, useEffect } from 'react';
import { db, auth } from '../config/instantdb';
import { useVoting } from '../hooks/useVoting';
import Auth from './Auth';
import './MemeCard.css';

export default function MemeCard({ meme }) {
  const [showAuth, setShowAuth] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(meme.votes || 0);
  
  // Get current user - InstantDB auth.user is reactive
  const user = auth.user;
  const userId = user?.id;

  // Check if user has already voted for this meme
  const { data: votesData } = db.useQuery(
    userId
      ? {
          votes: {
            $: {
              where: {
                memeId: meme.id,
                userId: userId,
              },
            },
          },
        }
      : {}
  );

  // Check if user has already voted
  const existingVote = userId && votesData?.votes?.length > 0 ? votesData.votes[0] : null;

  // Update hasVoted state when votes data changes
  useEffect(() => {
    if (userId && existingVote) {
      setHasVoted(true);
    } else {
      setHasVoted(false);
    }
  }, [userId, existingVote]);

  // Update vote count when meme data changes (real-time updates)
  useEffect(() => {
    setVoteCount(meme.votes || 0);
  }, [meme.votes]);

  const { handleVote } = useVoting(meme.id, voteCount, userId, existingVote);

  const handleVoteClick = async () => {
    if (hasVoted) return;
    
    // Show auth modal if not signed in
    if (!userId) {
      setShowAuth(true);
      return;
    }
    
    try {
      console.log('Voting on meme:', meme.id, 'Current votes:', voteCount);
      await handleVote();
      setHasVoted(true);
      setVoteCount(voteCount + 1);
      console.log('Vote successful, new count:', voteCount + 1);
    } catch (error) {
      console.error('Error voting:', error);
      if (error.message.includes('already voted') || error.message.includes('duplicate')) {
        setHasVoted(true);
        alert('You have already voted on this meme');
      } else {
        alert(`Failed to vote: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <>
      {showAuth && (
        <Auth onAuthSuccess={() => setShowAuth(false)} />
      )}
      <div className="meme-card">
        <div className="meme-card-image">
          <img src={meme.imageData} alt="Meme" />
        </div>
        <div className="meme-card-footer">
          <button 
            className={`vote-button ${hasVoted ? 'voted' : ''}`}
            onClick={handleVoteClick}
            disabled={hasVoted}
          >
            {hasVoted ? '✓ Voted' : '↑ Vote'}
          </button>
          <span className="vote-count">{voteCount} votes</span>
        </div>
      </div>
    </>
  );
}

