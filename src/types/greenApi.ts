export interface GreenApiCredentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'suspended'
  | 'starting'
  | 'pendingPassword';

export interface GetStateInstanceResponse {
  stateInstance: InstanceState;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
  username?: string;
  phoneNumber?: number;
  fromCache?: boolean;
}

export interface IncomingTextMessageBody {
  typeWebhook: 'incomingMessageReceived';
  idMessage: string;
  timestamp: number;
  senderData: {
    chatId: string;
    senderName: string;
    senderPhoneNumber: number;
  };
  messageData: {
    typeMessage: 'textMessage';
    textMessageData: {
      textMessage: string;
    };
  };
}
export interface ReceivedNotificationResponse {
  receiptId: number;
  body: IncomingTextMessageBody;
}

export interface ChatMessage {
  id: string;
  text: string;
  direction: 'incoming' | 'outgoing';
  timestamp: number;
}

export interface Recipient {
  chatId: string;
  phoneNumber: string;
  username?: string;
}