import { useState } from 'react';
import {
  checkCredentials,
  GreenApiInstanceStateError,
} from '../api/greenApi';
import type { GreenApiCredentials } from '../types/greenApi';

interface CredentialsPageProps {
  onSubmit: (credentials: GreenApiCredentials) => void;
}

function normalizeApiUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url.href.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function getInstanceStateErrorText(
  error: GreenApiInstanceStateError,
): string {
  switch (error.stateInstance) {
    case 'notAuthorized':
      return 'Instance не авторизован. Авторизуйте Telegram аккаунт в GREEN-API.';
    case 'starting':
      return 'Instance запускается. Повторите подключение через несколько секунд.';
    case 'blocked':
      return 'Instance заблокирован в GREEN-API.';
    case 'suspended':
      return 'Instance приостановлен в GREEN-API.';
    case 'pendingPassword':
      return 'Для instance требуется пароль или дополнительная авторизация.';
    default:
      return 'Instance не готов к работе.';
  }
}

export function CredentialsPage({
  onSubmit,
}: CredentialsPageProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedIdInstance = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();
    const normalizedApiUrl = normalizeApiUrl(apiUrl.trim());

    if (!trimmedIdInstance || !trimmedToken || !apiUrl.trim()) {
      setError('Заполни все поля');
      return;
    }

    if (!/^\d+$/.test(trimmedIdInstance)) {
      setError('idInstance должен содержать только цифры');
      return;
    }

    if (!normalizedApiUrl) {
      setError('apiUrl должен быть корректным http или https URL');
      return;
    }

    const credentials: GreenApiCredentials = {
      idInstance: trimmedIdInstance,
      apiTokenInstance: trimmedToken,
      apiUrl: normalizedApiUrl,
    };

    try {
      setIsLoading(true);
      setError('');

      await checkCredentials(credentials);

      onSubmit(credentials);
    } catch (error) {
      console.error(error);

      if (error instanceof GreenApiInstanceStateError) {
        setError(getInstanceStateErrorText(error));
      } else {
        setError(
          'Не удалось подключиться к GREEN-API. Проверь данные.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">
            G
          </div>

          <h1 className="auth-card__title">
            GREEN-API Chat
          </h1>

          <p className="auth-card__description">
            Подключите Telegram-инстанс,
            чтобы начать работу с сообщениями
          </p>
        </div>

        <form
          className="form"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <label className="form-field">
            <span className="form-field__label">
              idInstance
            </span>

            <input
              className="form-field__input"
              type="text"
              name="green-api-id-instance"
              value={idInstance}
              onChange={(event) =>
                setIdInstance(event.target.value)
              }
              placeholder="YOUR_ID_INSTANCE"
              disabled={isLoading}
              autoComplete="off"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">
              apiTokenInstance
            </span>

            <input
              className="form-field__input"
              type="password"
              name="green-api-token-instance"
              value={apiTokenInstance}
              onChange={(event) =>
                setApiTokenInstance(event.target.value)
              }
              placeholder="YOUR_API_TOKEN_INSTANCE"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">
              apiUrl
            </span>

            <input
              className="form-field__input"
              type="text"
              name="green-api-api-url"
              value={apiUrl}
              onChange={(event) =>
                setApiUrl(event.target.value)
              }
              placeholder="https://YOUR_API_HOST"
              disabled={isLoading}
              autoComplete="off"
            />
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? 'Подключение...'
              : 'Подключиться'}
          </button>
        </form>
      </section>
    </main>
  );
}
