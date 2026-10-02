import { useState } from 'react';

import { CredentialsPage } from './pages/CredentialsPage';
import { RecipientPage } from './pages/RecipientPage/RecipientPage.tsx';

import type { GreenApiCredentials } from './types/greenApi';
import { ChatPage } from './pages/ChatPage';

function App() {
  const [credentials, setCredentials] =
    useState<GreenApiCredentials | null>(null);

  const [chatId, setChatId] =
    useState<string | null>(null);

  if (!credentials) {
    return (
      <CredentialsPage
        onSubmit={setCredentials}
      />
    );
  }

  if (!chatId) {
    return (
      <RecipientPage
        credentials={credentials}
        onSuccess={setChatId}
      />
    );
  }

  return (
    <ChatPage
      credentials={credentials}
      chatId={chatId}
    />
  );
}

export default App;

// function App() {
//   return <h1>React работает</h1>;
// }
//
// export default App;