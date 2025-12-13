import { db, auth } from '../config/instantdb';

export function useVoting(memeId, currentVotes, userId, existingVote) {
  const handleVote = async () => {
    if (!userId) {
      throw new Error('You must be signed in to vote');
    }

    if (existingVote) {
      throw new Error('You have already voted on this meme');
    }

    try {
      const voteId = db.id();
      const newVoteCount = (currentVotes || 0) + 1;
      
      console.log('Creating vote for meme:', memeId, 'by user:', userId);
      
      // Create vote record and increment meme vote count atomically
      const result = await db.transact([
        db.tx.votes[voteId].update({
          memeId,
          userId,
          createdAt: Date.now(),
        }),
        db.tx.memes[memeId].update({
          votes: newVoteCount,
        }),
      ]);
      
      console.log('Vote transaction result:', result);
      return newVoteCount;
    } catch (error) {
      console.error('Error voting:', error);
      // Check if it's a duplicate vote error
      if (error.message && (error.message.includes('duplicate') || error.message.includes('already exists'))) {
        throw new Error('You have already voted on this meme');
      }
      throw error;
    }
  };

  return { handleVote };
}

