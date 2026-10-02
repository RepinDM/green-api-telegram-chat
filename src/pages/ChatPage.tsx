import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { sendMessage } from '../api/greenApi';
import { useNotifications } from '../hooks/useNotifications';
import { formatTime } from '../utils/formatTime';
import type {
  ChatMessage,
  GreenApiCredentials,
  Recipient,
} from '../types/greenApi';

interface ChatPageProps {
  credentials: GreenApiCredentials;
  recipient: Recipient;
  onBack: () => void;
}

export function ChatPage({
      credentials,
      recipient,
      onBack,}: ChatPageProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const { chatId } = recipient;

  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

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

  const displayName = recipient.username
    ? recipient.username.startsWith('@')
      ? recipient.username
      : `@${recipient.username}`
      : `+${recipient.phoneNumber}`;

  const cleanUsername =
    recipient.username?.replace(/^@/, '') ?? '';

  const avatarLetter = cleanUsername
    ? cleanUsername.charAt(0).toUpperCase()
    : recipient.phoneNumber.charAt(0);

  return (
    <div className="chat-shell">
      <div className="chat">
        <header className="chat__header">
          <div className="chat__header-left">
            <button
              className="chat__back"
              type="button"
              onClick={onBack}
              aria-label="Вернуться к выбору получателя"
            >
              ←
            </button>

            <div className="chat-user">
              <div className="chat-user__avatar">
                {avatarLetter}
              </div>

              <div>
                <h1 className="chat-user__name">
                  {displayName}
                </h1>

                <p className="chat-user__status">
                  +{recipient.phoneNumber}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="chat__messages">
          {messages.length === 0 && (
            <div className="chat__empty">
              Сообщений пока нет
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${
                message.direction === 'outgoing'
                  ? 'message-row--outgoing'
                  : 'message-row--incoming'
              }`}
            >
              <div
                className={`message ${
                  message.direction === 'outgoing'
                    ? 'message--outgoing'
                    : 'message--incoming'
                }`}
              >
                <p className="message__text">
                  {message.text}
                </p>

                <span className="message__time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </main>

        <footer className="chat__footer">
          <form
            className="chat__form"
            onSubmit={handleSubmit}
          >
            <input
              className="chat__input"
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Написать сообщение..."
              disabled={isSending}
            />

            <button
              className="chat__send"
              type="submit"
              disabled={
                isSending || !message.trim()
              }
            >
              {isSending
                ? '...'
                : 'Отправить'}
            </button>
          </form>

          {error && (
            <p className="chat__error">
              {error}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}