import { db } from '../config/instantdb';
import MemeCard from './MemeCard';
import './MemeFeed.css';

export default function MemeFeed() {
  const { data, isLoading, error } = db.useQuery({
    memes: {},
  });

  // Debug logging
  console.log('MemeFeed - isLoading:', isLoading);
  console.log('MemeFeed - data:', data);
  console.log('MemeFeed - error:', error);
  console.log('MemeFeed - memes count:', data?.memes?.length || 0);
  
  // Sort memes by createdAt if they exist
  const sortedMemes = data?.memes 
    ? [...data.memes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : [];

  if (isLoading) {
    return (
      <div className="meme-feed-loading">
        <p>Loading memes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meme-feed-empty">
        <p>Error loading memes: {error.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (!data?.memes || sortedMemes.length === 0) {
    return (
      <div className="meme-feed-empty">
        <p>No memes yet. Be the first to post one!</p>
        {error && (
          <p style={{ color: 'red', fontSize: '12px', marginTop: '10px' }}>
            Error: {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="meme-feed">
      {sortedMemes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}

