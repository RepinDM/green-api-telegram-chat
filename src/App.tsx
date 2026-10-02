import { useState } from 'react';
import { ChatPage } from './pages/ChatPage';
import { CredentialsPage } from './pages/CredentialsPage';
import { RecipientPage } from './pages/RecipientPage/RecipientPage';
import type {
  GreenApiCredentials,
  Recipient,
} from './types/greenApi';


function App() {
  const [credentials, setCredentials] =
    useState<GreenApiCredentials | null>(null);

  const [recipient, setRecipient] =
    useState<Recipient | null>(null);

  function handleBackToRecipients() {
    setRecipient(null);
  }

  if (!credentials) {
    return (
      <CredentialsPage
        onSubmit={setCredentials}
      />
    );
  }

  if (!recipient) {
    return (
      <RecipientPage
        credentials={credentials}
        onSuccess={setRecipient}
      />
    );
  }
  return (
    <ChatPage
      credentials={credentials}
      recipient={recipient}
      onBack={handleBackToRecipients}
    />
  );
}

export default App;