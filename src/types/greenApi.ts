export interface GreenApiCredentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface DeleteNotificationResponse {
  result: boolean;
  reason?: string;
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
  phoneNumber?: number | string;
  fromCache?: boolean;
}

export interface GreenApiMessageData {
  typeMessage?: string;
  textMessageData?: {
    textMessage?: string;
  };
}

export interface GreenApiSenderData {
  chatId?: string;
  senderName?: string;
  senderPhoneNumber?: number | string;
}

export interface GreenApiNotificationBody {
  typeWebhook?: string;
  idMessage?: string;
  timestamp?: number;
  senderData?: GreenApiSenderData;
  messageData?: GreenApiMessageData;
}

export interface IncomingTextMessageBody {
  typeWebhook: 'incomingMessageReceived';
  idMessage: string;
  timestamp: number;
  senderData: {
    chatId: string;
    senderName?: string;
    senderPhoneNumber?: number | string;
  };
  messageData: {
    typeMessage: 'textMessage';
    textMessageData: {
      textMessage: string;
    };
  };
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: GreenApiNotificationBody;
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

export interface PollingError {
  message: string;
  isPermanent: boolean;
}
