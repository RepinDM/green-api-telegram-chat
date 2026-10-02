import { useState } from 'react';

import { checkAccount } from '../../api/greenApi';
import { normalizePhone } from '../../utils/normalizePhone';

import type {
  GreenApiCredentials,
  Recipient,
} from '../../types/greenApi';

interface RecipientPageProps {
  credentials: GreenApiCredentials;
  onSuccess: (recipient: Recipient) => void;
  onLogout: () => void;
}

export function RecipientPage({
  credentials,
  onSuccess,
  onLogout,
}: RecipientPageProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 8) {
      setError('Введите корректный номер телефона');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await checkAccount(
        credentials,
        normalizedPhone,
      );

      if (!result.exist || !result.chatId) {
        setError('Telegram-аккаунт не найден');
        return;
      }

      onSuccess({
        chatId: result.chatId,
        phoneNumber: normalizedPhone,
        username: result.username,
      });
    } catch (error) {
      console.error(error);

      setError('Не удалось проверить получателя');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">
            Новый чат
          </h1>

          <p className="auth-card__description">
            Введите номер телефона пользователя Telegram.
          </p>
        </div>

        <form
          className="form"
          onSubmit={handleSubmit}
        >
          <label className="form-field">
            <span className="form-field__label">
              Номер телефона
            </span>

            <input
              className="form-field__input"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="+7 999 123-45-67"
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
              ? 'Поиск...'
              : 'Начать чат'}
          </button>
        </form>

        <div className="auth-card__footer">
          <button
            className="secondary-button"
            type="button"
            onClick={onLogout}
          >
            Сменить подключение
          </button>
        </div>
      </section>
    </main>
  );
}
