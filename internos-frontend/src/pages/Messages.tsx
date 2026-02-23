import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, User as UserIcon } from 'lucide-react';
import authService from '../api/auth.service';
import userService, { type User } from '../api/user.service';
import messagesService, { type IConversation, type IMessage } from '../api/messages.service';

const Messages = () => {
  const currentUser = authService.getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  const upsertConversation = (list: IConversation[], conversation: IConversation) => {
    const without = list.filter((item) => item.id !== conversation.id);
    return [conversation, ...without].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  };

  const mergeApiWithLocal = (apiConversations: IConversation[], localConversations: IConversation[]) => {
    let merged = [...apiConversations];
    const apiIds = new Set(apiConversations.map((item) => item.id));

    for (const localConversation of localConversations) {
      if (!apiIds.has(localConversation.id)) {
        // Keep locally created conversations that may not yet have first persisted message.
        merged = upsertConversation(merged, localConversation);
      }
    }

    return merged;
  };

  const loadPartnerUsers = async () => {
    if (!currentUser) return [] as User[];

    try {
      return await userService.getChatPartners();
    } catch {
      if (currentUser.role === 'Admin') {
        const allUsers = await userService.getAllUsers();
        return allUsers.filter((user) => user.role === 'Mentor' || user.role === 'Intern');
      }

      if (currentUser.role === 'Mentor') {
        return await userService.getInternUsers();
      }

      return await userService.getMentorUsers();
    }
  };

  const loadConversations = async (userId: number) => {
    const data = await messagesService.getConversations(userId);
    setConversations((prev) => {
      return mergeApiWithLocal(data, prev);
    });

    if (!activeConversationId && data.length > 0) setActiveConversationId(data[0].id);
  };

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    const data = await messagesService.getMessages(conversationId);
    setMessages(data);
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    const initialize = async () => {
      try {
        setLoading(true);
        const [partners] = await Promise.all([
          loadPartnerUsers(),
          loadConversations(currentUser.id),
        ]);
        setUsers(partners);
        setError('');
      } catch {
        setError('Failed to load chat data.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId).catch(() => setError('Failed to load messages.'));
  }, [activeConversationId]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const intervalId = window.setInterval(() => {
      loadConversations(currentUser.id).catch(() => undefined);
      if (activeConversationId) {
        loadMessages(activeConversationId).catch(() => undefined);
      }
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [activeConversationId, currentUser?.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const availablePartners = useMemo(() => {
    if (!currentUser) return [];
    return users.filter((user) => {
      if (user.id === currentUser.id) return false;
      if (currentUser.role === 'Mentor') return user.role === 'Intern';
      if (currentUser.role === 'Intern') return user.role === 'Mentor';
      return user.role === 'Mentor' || user.role === 'Intern';
    });
  }, [users, currentUser]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;

  const activePartner = useMemo(() => {
    if (!activeConversation || !currentUser) return null;
    const partnerIndex = activeConversation.participantIds.findIndex((id) => id !== currentUser.id);
    if (partnerIndex === -1) return null;
    const partnerId = activeConversation.participantIds[partnerIndex];
    const userFallback = users.find((u) => u.id === partnerId);
    return {
      id: partnerId,
      fullName: activeConversation.participantNames[partnerIndex] || userFallback?.fullName || 'Unknown',
      role: activeConversation.participantRoles[partnerIndex] || userFallback?.role || 'User',
      profilePhotoUrl: activeConversation.participantPhotoUrls?.[partnerIndex] || userFallback?.profilePhotoUrl || null,
    };
  }, [activeConversation, currentUser, users]);

  const getSenderPhoto = (message: IMessage) => {
    if (message.senderProfilePhotoUrl) return message.senderProfilePhotoUrl;
    if (message.senderId === activePartner?.id) return activePartner.profilePhotoUrl || null;
    return users.find((u) => u.id === message.senderId)?.profilePhotoUrl || null;
  };

  const handleStartConversation = async () => {
    if (!currentUser || !selectedPartnerId) return;
    const partner = availablePartners.find((user) => user.id === selectedPartnerId);
    if (!partner) return;

    try {
      const existingConversationId = `conv-${Math.min(currentUser.id, partner.id)}-${Math.max(currentUser.id, partner.id)}`;
      const existingConversation = conversations.find((item) => item.id === existingConversationId);
      if (existingConversation) {
        setActiveConversationId(existingConversation.id);
        setSelectedPartnerId('');
        return;
      }

      const conversation = await messagesService.startConversation(currentUser, partner);
      setActiveConversationId(conversation.id);
      setConversations((prev) => upsertConversation(prev, conversation));
      setSelectedPartnerId('');
      await loadMessages(conversation.id);
    } catch {
      setError('Failed to start conversation.');
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !activeConversation || !activePartner || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      await messagesService.sendMessage({
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderRole: currentUser.role,
        senderProfilePhotoUrl: users.find((u) => u.id === currentUser.id)?.profilePhotoUrl || null,
        recipientId: activePartner.id,
        recipientName: activePartner.fullName,
        recipientRole: activePartner.role,
        recipientProfilePhotoUrl: activePartner.profilePhotoUrl || null,
        content: newMessage.trim(),
      });
      setNewMessage('');
      await loadMessages(activeConversation.id);
      await loadConversations(currentUser.id);
    } catch {
      setError('Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500 font-semibold">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-11rem)]">
      <section className="bg-white border border-slate-200 rounded-3xl p-5 lg:col-span-1 flex flex-col overflow-hidden">
        <h1 className="text-xl font-black text-slate-900 mb-4">Messages</h1>

        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <select
              value={selectedPartnerId}
              onChange={(event) => setSelectedPartnerId(event.target.value ? Number(event.target.value) : '')}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Choose mentor/intern</option>
              {availablePartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.fullName} ({partner.role})
                </option>
              ))}
            </select>
            <button
              onClick={handleStartConversation}
              disabled={!selectedPartnerId}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl disabled:bg-slate-200 disabled:text-slate-400"
            >
              Start
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {conversations.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conversation) => {
              const partnerIndex = conversation.participantIds.findIndex((id) => id !== currentUser?.id);
              const partnerName = partnerIndex >= 0 ? conversation.participantNames[partnerIndex] : 'Unknown';
              const partnerRole = partnerIndex >= 0 ? conversation.participantRoles[partnerIndex] : 'User';
              const partnerPhotoUrl =
                (partnerIndex >= 0 ? conversation.participantPhotoUrls?.[partnerIndex] : null) ||
                (partnerIndex >= 0 ? users.find((u) => u.id === conversation.participantIds[partnerIndex])?.profilePhotoUrl : null) ||
                null;
              const isActive = conversation.id === activeConversationId;
              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black overflow-hidden shrink-0">
                      {partnerPhotoUrl ? (
                        <img src={partnerPhotoUrl} alt={partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{partnerName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{partnerName}</p>
                      <p className="text-[11px] text-indigo-600 font-semibold uppercase">{partnerRole}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl lg:col-span-2 flex flex-col overflow-hidden">
        {error && (
          <div className="px-5 py-3 text-sm bg-rose-50 border-b border-rose-100 text-rose-700">
            {error}
          </div>
        )}

        {activePartner ? (
          <>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black overflow-hidden">
                {activePartner.profilePhotoUrl ? (
                  <img src={activePartner.profilePhotoUrl} alt={activePartner.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{activePartner.fullName.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="font-black text-slate-900">{activePartner.fullName}</p>
                <p className="text-xs text-indigo-600 font-semibold uppercase">{activePartner.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-6">
                  No messages yet. Say hi.
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === currentUser?.id;
                  const senderPhoto = getSenderPhoto(message);
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[75%] ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!mine && (
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black overflow-hidden shrink-0">
                            {senderPhoto ? (
                              <img src={senderPhoto} alt={message.senderName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{message.senderName.charAt(0)}</span>
                            )}
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          mine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-200'
                        }`}>
                          {!mine && <p className="text-[10px] uppercase font-black mb-1 opacity-70">{message.senderName}</p>}
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-[10px] mt-1 ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-3">
              <input
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:bg-slate-300"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare size={40} className="mb-3 text-slate-300" />
            <p className="font-semibold">Select or start a conversation</p>
            <p className="text-sm mt-1">Mentor and intern messaging is ready.</p>
            <UserIcon size={14} className="mt-3 text-slate-300" />
          </div>
        )}
      </section>
    </div>
  );
};

export default Messages;
