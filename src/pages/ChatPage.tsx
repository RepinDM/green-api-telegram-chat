import { useCallback, useState } from 'react';

import { sendMessage } from '../api/greenApi';
import { useNotifications } from '../hooks/useNotifications';

import type {
  ChatMessage,
  GreenApiCredentials,
} from '../types/greenApi';

interface ChatPageProps {
  credentials: GreenApiCredentials;
  chatId: string;
}

export function ChatPage({
                           credentials,
                           chatId,
                         }: ChatPageProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleIncomingMessage = useCallback(
    (incomingMessage: {
      id: string;
      text: string;
      timestamp: number;
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          ...incomingMessage,
          direction: 'incoming',
        },
      ]);
    },
    [],
  );

  useNotifications({
    credentials,
    chatId,
    onMessage: handleIncomingMessage,
  });

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    try {
      setIsSending(true);
      setError('');

      const response = await sendMessage(
        credentials,
        chatId,
        trimmedMessage,
      );

      setMessages((prev) => [
        ...prev,
        {
          id: response.idMessage,
          text: trimmedMessage,
          direction: 'outgoing',
          timestamp: Math.floor(Date.now() / 1000),
        },
      ]);

      setMessage('');
    } catch (error) {
      console.error(error);
      setError('Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main>
      <h1>Telegram Chat</h1>

      <p>chatId: {chatId}</p>

      <section>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>
              {message.direction === 'outgoing'
                ? 'Вы'
                : 'Собеседник'}
            </strong>

            <p>{message.text}</p>
          </div>
        ))}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Введите сообщение"
          disabled={isSending}
        />

        <button
          type="submit"
          disabled={isSending || !message.trim()}
        >
          {isSending
            ? 'Отправка...'
            : 'Отправить'}
        </button>
      </form>

      {error && <p>{error}</p>}
    </main>
  );
}