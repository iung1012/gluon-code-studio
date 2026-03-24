

## Plano: Alterar modelo basic para Kimi

### Alteração no arquivo `supabase/functions/lovable-generate/index.ts`:

1. **Atualizar a constante MODELS** (linhas 186-192):
   ```typescript
   const MODELS = {
     basic: 'moonshotai/kimi-k2',           // Kimi K2 da Moonshot AI
     pro: 'z-ai/glm-4.7',
     vision: 'google/gemini-2.5-flash',
     fast: 'moonshotai/kimi-k2',            // Também Kimi para fast
     reasoning: 'z-ai/glm-4.7'
   };
   ```

2. **Re-deploy da edge function** `lovable-generate`

### Resultado:
- Modelo **basic** → `moonshotai/kimi-k2`
- Modelo **fast** → `moonshotai/kimi-k2` (mesmo que basic)
- Modelo **pro** → `z-ai/glm-4.7` (mantido)
- Modelo **vision** → `google/gemini-2.5-flash` (mantido para suporte a imagens)

