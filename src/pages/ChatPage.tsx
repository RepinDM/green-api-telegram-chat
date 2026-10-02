import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  GreenApiRequestError,
  sendMessage,
} from '../api/greenApi';
import { useNotifications } from '../hooks/useNotifications';
import { formatTime } from '../utils/formatTime';
import {
  limitMessageHistory,
  readStoredMessages,
  writeStoredMessages,
} from '../utils/messageStorage';
import type {
  ChatMessage,
  GreenApiCredentials,
  PollingError,
  Recipient,
} from '../types/greenApi';

interface ChatPageProps {
  credentials: GreenApiCredentials;
  recipient: Recipient;
  onBack: () => void;
  onLogout: () => void;
}

const MESSAGE_TEXT_LIMIT = 4096;

function getSendMessageErrorText(error: unknown): string {
  if (error instanceof GreenApiRequestError) {
    if (
      error.status === 466 ||
      error.responseText.includes('QUOTE_ALLOWED') ||
      error.responseText.includes(
        'CORRESPONDENTS_QUOTE_EXCEEDED',
      )
    ) {
      return (
        'Сообщение не отправлено: GREEN-API вернул лимит ' +
        'тарифа или квоты корреспондентов.'
      );
    }
  }

  return 'Не удалось отправить сообщение';
}

export function ChatPage({
  credentials,
  recipient,
  onBack,
  onLogout,
}: ChatPageProps) {
  const { chatId } = recipient;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readStoredMessages(credentials.idInstance, chatId),
  );
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [pollingError, setPollingError] =
    useState<PollingError | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === newMessage.id)) {
        return prev;
      }

      return limitMessageHistory([...prev, newMessage]);
    });
  }, []);

  const handleIncomingMessage = useCallback(
    (incomingMessage: {
      id: string;
      text: string;
      timestamp: number;
    }) => {
      addMessage({
        ...incomingMessage,
        direction: 'incoming',
      });
    },
    [addMessage],
  );

  const handlePollingError = useCallback((nextError: PollingError) => {
    setPollingError(nextError);
  }, []);

  const handlePollingRecovered = useCallback(() => {
    setPollingError(null);
  }, []);

  useNotifications({
    credentials,
    chatId,
    onMessage: handleIncomingMessage,
    onError: handlePollingError,
    onRecovered: handlePollingRecovered,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    writeStoredMessages(
      credentials.idInstance,
      chatId,
      messages,
    );
  }, [chatId, credentials.idInstance, messages]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (trimmedMessage.length > MESSAGE_TEXT_LIMIT) {
      setError(
        `Сообщение длиннее ${MESSAGE_TEXT_LIMIT} символов. Сократите текст.`,
      );
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

      addMessage({
        id: response.idMessage,
        text: trimmedMessage,
        direction: 'outgoing',
        timestamp: Math.floor(Date.now() / 1000),
      });

      setMessage('');
    } catch (error) {
      console.error(error);

      setError(getSendMessageErrorText(error));
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

              <div className="chat-user__meta">
                <h1 className="chat-user__name">
                  {displayName}
                </h1>

                <p className="chat-user__status">
                  +{recipient.phoneNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="chat__actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onLogout}
            >
              Сменить подключение
            </button>
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
              maxLength={MESSAGE_TEXT_LIMIT}
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

          {pollingError && (
            <p className="chat__error">
              {pollingError.message}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
