import { db } from '../config/instantdb';
import MemeCard from './MemeCard';
import './MemeFeed.css';

export default function MemeFeed() {
  const { data, isLoading } = db.useQuery({
    memes: {
      $: {
        order: { createdAt: 'desc' },
      },
    },
  });

  if (isLoading) {
    return (
      <div className="meme-feed-loading">
        <p>Loading memes...</p>
      </div>
    );
  }

  if (!data?.memes || data.memes.length === 0) {
    return (
      <div className="meme-feed-empty">
        <p>No memes yet. Be the first to post one!</p>
      </div>
    );
  }

  return (
    <div className="meme-feed">
      {data.memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}

