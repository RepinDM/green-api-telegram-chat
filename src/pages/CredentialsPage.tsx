import { useState } from 'react';
import { checkCredentials } from '../api/greenApi';
import type { GreenApiCredentials } from '../types/greenApi';

interface CredentialsPageProps {
  onSubmit: (credentials: GreenApiCredentials) => void;
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

    if (
      !idInstance.trim() ||
      !apiTokenInstance.trim() ||
      !apiUrl.trim()
    ) {
      setError('Заполни все поля');
      return;
    }

    const credentials: GreenApiCredentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim(),
    };

    try {
      setIsLoading(true);
      setError('');

      await checkCredentials(credentials);

      onSubmit(credentials);
    } catch (error) {
      console.error(error);

      setError(
        'Не удалось подключиться к GREEN-API. Проверь данные.',
      );
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
        >
          <label className="form-field">
          <span className="form-field__label">
            idInstance
          </span>

            <input
              className="form-field__input"
              type="text"
              value={idInstance}
              onChange={(event) =>
                setIdInstance(event.target.value)
              }
              placeholder="Например: 410022753281"
              disabled={isLoading}
            />
          </label>

          <label className="form-field">
          <span className="form-field__label">
            apiTokenInstance
          </span>

            <input
              className="form-field__input"
              type="password"
              value={apiTokenInstance}
              onChange={(event) =>
                setApiTokenInstance(event.target.value)
              }
              placeholder="Введите API token"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </label>

          <label className="form-field">
          <span className="form-field__label">
            apiUrl
          </span>

            <input
              className="form-field__input"
              type="text"
              value={apiUrl}
              onChange={(event) =>
                setApiUrl(event.target.value)
              }
              placeholder="https://4100.api.green-api.com"
              disabled={isLoading}
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