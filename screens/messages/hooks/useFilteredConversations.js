import { useState, useEffect, useMemo } from 'react';

const getPreviewText = (lastMessage, n = 40) => {
  if (!lastMessage) return '';
  const str = typeof lastMessage === 'string' ? lastMessage : (lastMessage?.content || '');
  return str.length > n ? str.substring(0, n) + '…' : str;
};

export const useFilteredConversations = (conversations, getOtherUser) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredConversations, setFilteredConversations] = useState([]);

  const tabCount = useMemo(() => ({
    all: conversations.length,
    linkme: conversations.filter(c => c.chatType === 'linkme').length,
    system: conversations.filter(c => c.chatType === 'system').length,
  }), [conversations]);

  useEffect(() => {
    let list = conversations;
    if (activeTab === 'linkme') list = list.filter(c => c.chatType === 'linkme');
    else if (activeTab === 'system') list = list.filter(c => c.chatType === 'system');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(conv => {
        if (conv.chatType === 'system') {
          return getPreviewText(conv.lastMessage).toLowerCase().includes(q) ||
                 conv.metadata?.title?.toLowerCase().includes(q);
        }
        const other = getOtherUser(conv);
        return (
          other?.username?.toLowerCase().includes(q) ||
          other?.email?.toLowerCase().includes(q) ||
          getPreviewText(conv.lastMessage).toLowerCase().includes(q)
        );
      });
    }
    setFilteredConversations(list);
  }, [searchQuery, conversations, activeTab, getOtherUser]);

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    filteredConversations,
    tabCount,
  };
};