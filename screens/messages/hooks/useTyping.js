import { useCallback } from 'react';

export const useTyping = (typingUsers, currentUserId) => {
  const getTypingText = useCallback((conversationId) => {
    const typing = typingUsers[conversationId];
    if (typing && typing.userId !== currentUserId) {
      return 'typing…';
    }
    return null;
  }, [typingUsers, currentUserId]);

  return { getTypingText };
};