import { useState } from "react";
import { checkAccount } from '../../api/greenApi.ts';
import type { GreenApiCredentials } from '../../types/greenApi.ts';
import { normalizePhone} from "../../utils/normalizePhone.ts";

interface RecipientPageProps {
  credentials: GreenApiCredentials;
  onSuccess: (chatId: string) => void;
}

export function RecipientPage({
  credentials,
  onSuccess,
}: RecipientPageProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);

    if(!normalizedPhone) {
      setError('Введите номер телефона');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await checkAccount(
        credentials,
        normalizedPhone,
      );

      if(!result.exist || !result.chatId) {
        setError('Telegram-аккаунт не найден');
        return;
      }
      onSuccess(result.chatId)
    } catch (error) {
      console.error(error);
      setError('Не удалось проверить получателя');
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <main>
      <h1>Новый чат</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Номер телефона получателя

          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="+7 999 123-45-67"
            disabled={isLoading}
          />
        </label>

        {error && <p>{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? 'Проверка...'
            : 'Начать чат'}
        </button>
      </form>
    </main>
  );

}