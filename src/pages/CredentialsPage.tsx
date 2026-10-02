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
    <main>
      <h1>Подключение к GREEN-API</h1>

      <form onSubmit={handleSubmit}>
        <label>
          idInstance
          <input
            type="text"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            disabled={isLoading}
          />
        </label>

        <label>
          apiTokenInstance
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(event) =>
              setApiTokenInstance(event.target.value)
            }
            disabled={isLoading}
          />
        </label>

        <label>
          apiUrl
          <input
            type="text"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="https://..."
            disabled={isLoading}
          />
        </label>

        {error && <p>{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Проверка...' : 'Продолжить'}
        </button>
      </form>
    </main>
  );
}