import { useEffect } from 'react';
import {
  deleteNotification,
  receiveNotification,
} from "../api/greenApi.ts";

import type { GreenApiCredentials } from "../api/greenApi.ts";

interface UseNotificationsParams {
  credentials: GreenApiCredentials;
  chatId: string;
  onMessage: (message: {
    id: string;
    text: string;
    timestamp: number;
  }) => void;
}

export function useNotifications({
  credentials,
  chatId,
  onMessage,
  }: UseNotificationsParams) {
  useEffect(() => {
    let isActive = true;

    async function pollingLoop(){
      while (isActive) {
        try {
          const notification = await receiveNotification(credentials);

          if(!notification) {
            continue
          }
          const { receiptId, body } = notification;

          if(
            body.typeWebhook === 'incomingMessageReceived' &&
            body.messageData?.typeMessage === 'textMessage' &&
            body.senderData?.chatId === chatId
          ) {
            onMessage({
              id: body.idMessage,
              text:
                body.messageData.textMessageData.textMessage,
              timestamp: body.timestamp,
            });
          }

          await deleteNotification(
            credentials,
            receiptId,
          );
        } catch (error) {
          console.error('Notification polling error:', error);

          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    pollingLoop();

    return () => {
      isActive = false;
    };
  }, [credentials, chatId, onMessage]);
}