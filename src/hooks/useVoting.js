import { db } from '../config/instantdb';

export function useVoting(memeId, initialVotes) {
  const handleVote = async () => {
    try {
      const newVoteCount = initialVotes + 1;
      // Increment vote count
      await db.transact([
        db.tx.memes[memeId].update({
          votes: newVoteCount,
        }),
      ]);
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  return { handleVote };
}

