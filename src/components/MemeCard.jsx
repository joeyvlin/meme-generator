import { useState } from 'react';
import { useVoting } from '../hooks/useVoting';
import './MemeCard.css';

export default function MemeCard({ meme }) {
  const [hasVoted, setHasVoted] = useState(false);
  const voteCount = meme.votes || 0;
  const { handleVote } = useVoting(meme.id, voteCount);

  const handleVoteClick = async () => {
    if (hasVoted) return;
    
    try {
      await handleVote();
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
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
  );
}

