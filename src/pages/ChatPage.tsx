import { useState } from 'react';
import { sendMessage } from '../api/greenApi';
import type { GreenApiCredentials } from '../types/greenApi';

interface ChatPageProps {
  credentials: GreenApiCredentials;
  chatId: string;
}

export function ChatPage({
                           credentials,
                           chatId,
                         }: ChatPageProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sentMessages, setSentMessages] = useState<string[]>([]);

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

      await sendMessage(
        credentials,
        chatId,
        trimmedMessage,
      );

      setSentMessages((prev) => [
        ...prev,
        trimmedMessage,
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
        {sentMessages.map((text, index) => (
          <p key={`${text}-${index}`}>
            {text}
          </p>
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