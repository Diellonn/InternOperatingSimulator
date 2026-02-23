import axiosInstance from './axiosInstance';

export interface IConversation {
  id: string;
  participantIds: number[];
  participantNames: string[];
  participantRoles: string[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  recipientId: number;
  content: string;
  createdAt: string;
}

interface IMessageStore {
  conversations: IConversation[];
  messages: IMessage[];
}

interface ISendMessagePayload {
  conversationId: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  recipientId: number;
  recipientName: string;
  recipientRole: string;
  content: string;
}

const STORAGE_KEY = 'internos_messages_store_v1';

class MessagesService {
  private getStore(): IMessageStore {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], messages: [] };

    try {
      const parsed = JSON.parse(raw) as IMessageStore;
      return {
        conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      };
    } catch {
      return { conversations: [], messages: [] };
    }
  }

  private setStore(store: IMessageStore) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  private buildConversationId(userA: number, userB: number): string {
    const [minId, maxId] = [userA, userB].sort((a, b) => a - b);
    return `conv-${minId}-${maxId}`;
  }

  async getConversations(currentUserId: number): Promise<IConversation[]> {
    try {
      const response = await axiosInstance.get<IConversation[]>('/messages/conversations');
      return response.data;
    } catch {
      const store = this.getStore();
      return store.conversations
        .filter((conversation) => conversation.participantIds.includes(currentUserId))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }
  }

  async getMessages(conversationId: string): Promise<IMessage[]> {
    try {
      const response = await axiosInstance.get<IMessage[]>(`/messages/conversations/${conversationId}`);
      return response.data;
    } catch {
      const store = this.getStore();
      return store.messages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }

  async startConversation(
    currentUser: { id: number; fullName: string; role: string },
    partner: { id: number; fullName: string; role: string }
  ): Promise<IConversation> {
    const conversationId = this.buildConversationId(currentUser.id, partner.id);

    try {
      const response = await axiosInstance.post<IConversation>('/messages/conversations', {
        participantUserId: partner.id,
      });
      return response.data;
    } catch {
      const store = this.getStore();
      const existing = store.conversations.find((conversation) => conversation.id === conversationId);
      if (existing) return existing;

      const now = new Date().toISOString();
      const createdConversation: IConversation = {
        id: conversationId,
        participantIds: [currentUser.id, partner.id],
        participantNames: [currentUser.fullName, partner.fullName],
        participantRoles: [currentUser.role, partner.role],
        lastMessage: 'Conversation started',
        lastMessageAt: now,
      };

      store.conversations.push(createdConversation);
      this.setStore(store);
      return createdConversation;
    }
  }

  async sendMessage(payload: ISendMessagePayload): Promise<IMessage> {
    try {
      const response = await axiosInstance.post<IMessage>('/messages', {
        conversationId: payload.conversationId,
        recipientUserId: payload.recipientId,
        content: payload.content,
      });
      return response.data;
    } catch {
      const store = this.getStore();
      const now = new Date().toISOString();
      const newMessage: IMessage = {
        id: `msg-${Date.now()}`,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        senderName: payload.senderName,
        senderRole: payload.senderRole,
        recipientId: payload.recipientId,
        content: payload.content,
        createdAt: now,
      };

      const conversation = store.conversations.find((item) => item.id === payload.conversationId);
      if (!conversation) {
        store.conversations.push({
          id: payload.conversationId,
          participantIds: [payload.senderId, payload.recipientId],
          participantNames: [payload.senderName, payload.recipientName],
          participantRoles: [payload.senderRole, payload.recipientRole],
          lastMessage: payload.content,
          lastMessageAt: now,
        });
      } else {
        conversation.lastMessage = payload.content;
        conversation.lastMessageAt = now;
      }

      store.messages.push(newMessage);
      this.setStore(store);
      return newMessage;
    }
  }
}

export default new MessagesService();
