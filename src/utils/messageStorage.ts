import type { ChatMessage } from '../types/greenApi';
import {
  getWebStorage,
  readStorageItem,
  writeStorageItem,
} from './storage';

export const MESSAGE_HISTORY_LIMIT = 300;

export function getMessagesStorageKey(
  idInstance: string,
  chatId: string,
): string {
  return `green-api-messages:${idInstance}:${chatId}`;
}

export function limitMessageHistory(
  messages: ChatMessage[],
): ChatMessage[] {
  return messages.slice(-MESSAGE_HISTORY_LIMIT);
}

export function isChatMessage(
  value: unknown,
): value is ChatMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'text' in value &&
    'direction' in value &&
    'timestamp' in value &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    (value.direction === 'incoming' ||
      value.direction === 'outgoing') &&
    typeof value.timestamp === 'number'
  );
}

export function isChatMessageList(
  value: unknown,
): value is ChatMessage[] {
  return Array.isArray(value) && value.every(isChatMessage);
}

export function readStoredMessages(
  idInstance: string,
  chatId: string,
): ChatMessage[] {
  return (
    readStorageItem(
      getWebStorage('localStorage'),
      getMessagesStorageKey(idInstance, chatId),
      isChatMessageList,
    ) ?? []
  );
}

export function writeStoredMessages(
  idInstance: string,
  chatId: string,
  messages: ChatMessage[],
): boolean {
  return writeStorageItem(
    getWebStorage('localStorage'),
    getMessagesStorageKey(idInstance, chatId),
    limitMessageHistory(messages),
  );
}

export function appendStoredMessage(
  idInstance: string,
  chatId: string,
  message: ChatMessage,
): void {
  const messages = readStoredMessages(idInstance, chatId);

  if (messages.some((item) => item.id === message.id)) {
    return;
  }

  writeStoredMessages(idInstance, chatId, [
    ...messages,
    message,
  ]);
}
