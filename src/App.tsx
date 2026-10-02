import { useEffect, useState } from 'react';

import { ChatPage } from './pages/ChatPage';
import { CredentialsPage } from './pages/CredentialsPage';
import { RecipientPage } from './pages/RecipientPage/RecipientPage';
import {
  getWebStorage,
  readStorageItem,
  writeStorageItem,
} from './utils/storage';

import type {
  GreenApiCredentials,
  Recipient,
} from './types/greenApi';

const CREDENTIALS_STORAGE_KEY = 'green-api-credentials';
const RECIPIENT_STORAGE_KEY = 'green-api-recipient';

interface PersistedRecipient {
  idInstance: string;
  recipient: Recipient;
}

function isGreenApiCredentials(
  value: unknown,
): value is GreenApiCredentials {
  return (
    typeof value === 'object' &&
    value !== null &&
    'idInstance' in value &&
    'apiTokenInstance' in value &&
    'apiUrl' in value &&
    typeof value.idInstance === 'string' &&
    typeof value.apiTokenInstance === 'string' &&
    typeof value.apiUrl === 'string'
  );
}

function isRecipient(value: unknown): value is Recipient {
  return (
    typeof value === 'object' &&
    value !== null &&
    'chatId' in value &&
    'phoneNumber' in value &&
    typeof value.chatId === 'string' &&
    typeof value.phoneNumber === 'string' &&
    (!('username' in value) ||
      typeof value.username === 'string' ||
      value.username === undefined)
  );
}

function isPersistedRecipient(
  value: unknown,
): value is PersistedRecipient {
  return (
    typeof value === 'object' &&
    value !== null &&
    'idInstance' in value &&
    'recipient' in value &&
    typeof value.idInstance === 'string' &&
    isRecipient(value.recipient)
  );
}

function App() {
  const sessionStorageRef = getWebStorage('sessionStorage');
  const localStorageRef = getWebStorage('localStorage');

  const [credentials, setCredentials] =
    useState<GreenApiCredentials | null>(() =>
      readStorageItem(
        sessionStorageRef,
        CREDENTIALS_STORAGE_KEY,
        isGreenApiCredentials,
      ),
    );

  const [recipient, setRecipient] =
    useState<Recipient | null>(() => {
      if (!credentials) {
        return null;
      }

      const persistedRecipient = readStorageItem(
        localStorageRef,
        RECIPIENT_STORAGE_KEY,
        isPersistedRecipient,
      );

      if (
        persistedRecipient?.idInstance === credentials.idInstance
      ) {
        return persistedRecipient.recipient;
      }

      return null;
    });

  useEffect(() => {
    writeStorageItem(
      sessionStorageRef,
      CREDENTIALS_STORAGE_KEY,
      credentials,
    );
  }, [credentials, sessionStorageRef]);

  useEffect(() => {
    if (!credentials || !recipient) {
      writeStorageItem(
        localStorageRef,
        RECIPIENT_STORAGE_KEY,
        null,
      );
      return;
    }

    writeStorageItem(
      localStorageRef,
      RECIPIENT_STORAGE_KEY,
      {
        idInstance: credentials.idInstance,
        recipient,
      },
    );
  }, [credentials, localStorageRef, recipient]);

  function handleCredentialsSubmit(
    nextCredentials: GreenApiCredentials,
  ) {
    setCredentials((prevCredentials) => {
      if (
        prevCredentials?.idInstance &&
        prevCredentials.idInstance !== nextCredentials.idInstance
      ) {
        setRecipient(null);
      }

      return nextCredentials;
    });
  }

  function handleBackToRecipients() {
    setRecipient(null);
  }

  function handleLogout() {
    setRecipient(null);
    setCredentials(null);
  }

  if (!credentials) {
    return (
      <CredentialsPage
        onSubmit={handleCredentialsSubmit}
      />
    );
  }

  if (!recipient) {
    return (
      <RecipientPage
        credentials={credentials}
        onSuccess={setRecipient}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatPage
      credentials={credentials}
      recipient={recipient}
      onBack={handleBackToRecipients}
      onLogout={handleLogout}
    />
  );
}

export default App;
