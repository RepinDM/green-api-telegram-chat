import type {
  CheckAccountResponse,
  DeleteNotificationResponse,
  GreenApiCredentials,
  InstanceState,
  ReceiveNotificationResponse,
  SendMessageResponse,
} from '../types/greenApi';

export class GreenApiRequestError extends Error {
  readonly status: number;
  readonly responseText: string;

  constructor(
    message: string,
    status: number,
    responseText: string,
  ) {
    super(message);
    this.name = 'GreenApiRequestError';
    this.status = status;
    this.responseText = responseText;
  }
}

export class GreenApiInstanceStateError extends Error {
  readonly stateInstance: string;

  constructor(stateInstance: string) {
    super(`GREEN-API instance is ${stateInstance}`);
    this.name = 'GreenApiInstanceStateError';
    this.stateInstance = stateInstance;
  }
}

function getBaseUrl(credentials: GreenApiCredentials): string {
  return credentials.apiUrl.replace(/\/+$/, '');
}

function getInstanceUrl(
  credentials: GreenApiCredentials,
  method: string,
): string {
  return (
    `${getBaseUrl(credentials)}` +
    `/waInstance${credentials.idInstance}` +
    `/${method}/${credentials.apiTokenInstance}`
  );
}

async function getResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function parseJsonResponse(
  response: Response,
  methodName: string,
): Promise<unknown> {
  const text = await getResponseText(response);

  if (!text) {
    throw new Error(`${methodName} returned empty response`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${methodName} returned invalid JSON`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCheckAccountResponse(
  value: unknown,
): value is CheckAccountResponse {
  return isRecord(value) && typeof value.exist === 'boolean';
}

function isSendMessageResponse(
  value: unknown,
): value is SendMessageResponse {
  return isRecord(value) && typeof value.idMessage === 'string';
}

function isInstanceState(value: unknown): value is InstanceState {
  return (
    value === 'authorized' ||
    value === 'notAuthorized' ||
    value === 'blocked' ||
    value === 'suspended' ||
    value === 'starting' ||
    value === 'pendingPassword'
  );
}

function isDeleteNotificationResponse(
  value: unknown,
): value is DeleteNotificationResponse {
  return isRecord(value) && typeof value.result === 'boolean';
}

function normalizeReceiveNotificationResponse(
  value: unknown,
): ReceiveNotificationResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const receiptId = Number(value.receiptId);

  if (!Number.isFinite(receiptId)) {
    return null;
  }

  return {
    receiptId,
    body: isRecord(value.body) ? value.body : {},
  };
}

function createRequestError(
  methodName: string,
  response: Response,
  responseText: string,
): GreenApiRequestError {
  return new GreenApiRequestError(
    `${methodName} failed: ${response.status} ${responseText}`,
    response.status,
    responseText,
  );
}

export async function checkCredentials(
  credentials: GreenApiCredentials,
): Promise<void> {
  const url = getInstanceUrl(credentials, 'getStateInstance');

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await getResponseText(response);

    throw createRequestError(
      'GetStateInstance',
      response,
      errorText,
    );
  }

  const data = await parseJsonResponse(response, 'GetStateInstance');

  if (!isRecord(data) || !isInstanceState(data.stateInstance)) {
    throw new Error('GetStateInstance returned unexpected response');
  }

  if (data.stateInstance !== 'authorized') {
    throw new GreenApiInstanceStateError(data.stateInstance);
  }
}

export async function sendMessage(
  credentials: GreenApiCredentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const url = getInstanceUrl(credentials, 'sendMessage');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId,
      message,
    }),
  });

  if (!response.ok) {
    const errorText = await getResponseText(response);

    throw createRequestError('SendMessage', response, errorText);
  }

  const data = await parseJsonResponse(response, 'SendMessage');

  if (!isSendMessageResponse(data)) {
    throw new Error('SendMessage returned unexpected response');
  }

  return data;
}

export async function checkAccount(
  credentials: GreenApiCredentials,
  phoneNumber: string,
): Promise<CheckAccountResponse> {
  const url = getInstanceUrl(credentials, 'checkAccount');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: Number(phoneNumber),
    }),
  });

  if (!response.ok) {
    const errorText = await getResponseText(response);

    throw createRequestError('CheckAccount', response, errorText);
  }

  const data = await parseJsonResponse(response, 'CheckAccount');

  if (!isCheckAccountResponse(data)) {
    throw new Error('CheckAccount returned unexpected response');
  }

  return data;
}

export async function receiveNotification(
  credentials: GreenApiCredentials,
  signal?: AbortSignal,
): Promise<ReceiveNotificationResponse | null> {
  const url =
    `${getInstanceUrl(credentials, 'receiveNotification')}` +
    `?receiveTimeout=20`;

  const response = await fetch(url, { signal });

  if (response.status === 408) {
    return null;
  }

  if (!response.ok) {
    const errorText = await getResponseText(response);

    throw createRequestError(
      'ReceiveNotification',
      response,
      errorText,
    );
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('ReceiveNotification returned invalid JSON');
  }

  return normalizeReceiveNotificationResponse(data);
}

export async function deleteNotification(
  credentials: GreenApiCredentials,
  receiptId: number,
): Promise<void> {
  const url =
    `${getInstanceUrl(credentials, 'deleteNotification')}` +
    `/${receiptId}`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await getResponseText(response);

    throw createRequestError(
      'DeleteNotification',
      response,
      errorText,
    );
  }

  const data = await parseJsonResponse(
    response,
    'DeleteNotification',
  );

  if (!isDeleteNotificationResponse(data)) {
    throw new Error(
      'DeleteNotification returned unexpected response',
    );
  }

  if (!data.result) {
    throw new Error(
      `DeleteNotification failed: result=false reason=${data.reason ?? ''}`,
    );
  }
}
