import { useEffect } from 'react';
import {
  deleteNotification,
  GreenApiRequestError,
  receiveNotification,
} from '../api/greenApi';
import { appendStoredMessage } from '../utils/messageStorage';

import type {
  ChatMessage,
  GreenApiCredentials,
  GreenApiNotificationBody,
  IncomingTextMessageBody,
  PollingError,
} from '../types/greenApi';

interface UseNotificationsParams {
  credentials: GreenApiCredentials;
  chatId: string;
  onMessage: (message: {
    id: string;
    text: string;
    timestamp: number;
  }) => void;
  onError: (error: PollingError) => void;
  onRecovered: () => void;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError'
  );
}

function isIncomingTextMessageBody(
  body: GreenApiNotificationBody,
): body is IncomingTextMessageBody {
  return (
    body.typeWebhook === 'incomingMessageReceived' &&
    typeof body.idMessage === 'string' &&
    typeof body.timestamp === 'number' &&
    typeof body.senderData?.chatId === 'string' &&
    body.messageData?.typeMessage === 'textMessage' &&
    typeof body.messageData.textMessageData?.textMessage ===
      'string'
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getPollingError(error: unknown): PollingError {
  if (error instanceof GreenApiRequestError) {
    const responseText = error.responseText.toLowerCase();
    const isPermanent =
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403 ||
      responseText.includes('webhook url');

    if (responseText.includes('webhook url')) {
      return {
        isPermanent: true,
        message:
          'Получение сообщений недоступно: в настройках instance заполнен webhookUrl. Очистите webhookUrl для HTTP polling.',
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        isPermanent: true,
        message:
          'Получение сообщений остановлено: GREEN-API отклонил авторизацию instance.',
      };
    }

    if (error.status === 400) {
      return {
        isPermanent: true,
        message:
          'Получение сообщений остановлено: GREEN-API вернул постоянную ошибку запроса.',
      };
    }

    return {
      isPermanent,
      message:
        'Временная ошибка получения сообщений. Приложение повторит запрос автоматически.',
    };
  }

  return {
    isPermanent: false,
    message:
      'Временная ошибка получения сообщений. Приложение повторит запрос автоматически.',
  };
}

export function useNotifications({
  credentials,
  chatId,
  onMessage,
  onError,
  onRecovered,
}: UseNotificationsParams) {
  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();
    let consecutiveErrors = 0;

    async function pollingLoop() {
      while (isActive) {
        try {
          const notification = await receiveNotification(
            credentials,
            abortController.signal,
          );

          if (!isActive) {
            continue;
          }

          if (!notification) {
            if (consecutiveErrors > 0) {
              consecutiveErrors = 0;
              onRecovered();
            }

            continue;
          }

          const { receiptId, body } = notification;

          if (
            isIncomingTextMessageBody(body) &&
            body.senderData.chatId === chatId
          ) {
            onMessage({
              id: body.idMessage,
              text:
                body.messageData.textMessageData.textMessage,
              timestamp: body.timestamp,
            });
          } else if (isIncomingTextMessageBody(body)) {
            const message: ChatMessage = {
              id: body.idMessage,
              text:
                body.messageData.textMessageData.textMessage,
              direction: 'incoming',
              timestamp: body.timestamp,
            };

            appendStoredMessage(
              credentials.idInstance,
              body.senderData.chatId,
              message,
            );
          }

          await deleteNotification(credentials, receiptId);
          consecutiveErrors = 0;
          onRecovered();
        } catch (error) {
          if (!isActive || isAbortError(error)) {
            return;
          }

          console.error('Notification polling error:', error);

          consecutiveErrors += 1;
          const pollingError = getPollingError(error);

          if (
            error instanceof Error &&
            error.message.startsWith('DeleteNotification')
          ) {
            onError({
              isPermanent: true,
              message:
                'Не удалось удалить notification из очереди GREEN-API. Получение новых сообщений может быть заблокировано.',
            });
          } else if (
            pollingError.isPermanent ||
            consecutiveErrors >= 3
          ) {
            onError(pollingError);
          }

          await wait(3000);
        }
      }
    }

    pollingLoop();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [credentials, chatId, onError, onMessage, onRecovered]);
}
