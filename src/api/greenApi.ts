import type {
  CheckAccountResponse,
  GetStateInstanceResponse,
  GreenApiCredentials,
  SendMessageResponse,
} from '../types/greenApi';

export async function checkCredentials(
  credentials: GreenApiCredentials,
): Promise<void> {
  const url = `${credentials.apiUrl}/waInstance${credentials.idInstance}/getStateInstance/${credentials.apiTokenInstance}`;

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Credentials check failed: ${response.status}`);
  }
}

export async function sendMessage(
  credentials: GreenApiCredentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const url = `${credentials.apiUrl}/waInstance${credentials.idInstance}/sendMessage/${credentials.apiTokenInstance}`;

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
    throw new Error(`SendMessage failed: ${response.status}`);
  }

  return response.json();
}

export async function checkAccount(
  credentials: GreenApiCredentials,
  phoneNumber: string,
): Promise<CheckAccountResponse> {
  const url =
    `${credentials.apiUrl}` +
    `/waInstance${credentials.idInstance}` +
    `/checkAccount/${credentials.apiTokenInstance}`;

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
    const errorText = await response.text();

    throw new Error(
      `CheckAccount failed: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}