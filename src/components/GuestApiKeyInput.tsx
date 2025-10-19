import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Key, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GuestApiKeyInputProps {
  onApiKeySubmit: (key: string) => void;
  onCancel: () => void;
}

export const GuestApiKeyInput: React.FC<GuestApiKeyInputProps> = ({
  onApiKeySubmit,
  onCancel
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Por favor, insira uma chave API válida');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Test the API key with a simple request
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': '2code AI Generator'
        }
      });

      if (!response.ok) {
        throw new Error('Chave API inválida');
      }

      onApiKeySubmit(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar chave API');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Modo Convidado
          </CardTitle>
          <CardDescription className="text-gray-600">
            Insira sua chave API do OpenRouter para usar o gerador de código
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
                Chave API do OpenRouter
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isValidating}
                className="w-full"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isValidating || !apiKey.trim()}
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Validando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={isValidating}
              >
                Cancelar
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Como obter uma chave API:
            </h4>
            <ol className="text-xs text-blue-700 space-y-1">
              <li>1. Acesse <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai</a></li>
              <li>2. Crie uma conta gratuita</li>
              <li>3. Vá para "Keys" no painel</li>
              <li>4. Crie uma nova chave API</li>
              <li>5. Cole a chave aqui</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
