import { OPENROUTER_MODELS, OpenRouterModel } from '@/hooks/useOpenRouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Zap, Brain, Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const getModelIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'google':
      return <Sparkles className="w-4 h-4" />;
    case 'openai':
      return <Brain className="w-4 h-4" />;
    case 'anthropic':
      return <Zap className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

const formatContextLength = (length: number): string => {
  if (length >= 1000000) {
    return `${(length / 1000000).toFixed(1)}M`;
  }
  return `${(length / 1000).toFixed(0)}K`;
};

export const ModelSelector = ({ value, onValueChange }: ModelSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full max-w-xs bg-background/60 backdrop-blur-sm border-border/40">
        <SelectValue placeholder="Selecione o modelo" />
      </SelectTrigger>
      <SelectContent className="max-h-96">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Google
        </div>
        {OPENROUTER_MODELS.filter(m => m.provider === 'Google').map((model) => (
          <SelectItem key={model.id} value={model.id} className="cursor-pointer">
            <div className="flex items-center gap-2">
              {getModelIcon(model.provider)}
              <span className="font-medium">{model.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {formatContextLength(model.contextLength)}
              </Badge>
            </div>
          </SelectItem>
        ))}
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
          OpenAI
        </div>
        {OPENROUTER_MODELS.filter(m => m.provider === 'OpenAI').map((model) => (
          <SelectItem key={model.id} value={model.id} className="cursor-pointer">
            <div className="flex items-center gap-2">
              {getModelIcon(model.provider)}
              <span className="font-medium">{model.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {formatContextLength(model.contextLength)}
              </Badge>
            </div>
          </SelectItem>
        ))}
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
          Anthropic
        </div>
        {OPENROUTER_MODELS.filter(m => m.provider === 'Anthropic').map((model) => (
          <SelectItem key={model.id} value={model.id} className="cursor-pointer">
            <div className="flex items-center gap-2">
              {getModelIcon(model.provider)}
              <span className="font-medium">{model.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {formatContextLength(model.contextLength)}
              </Badge>
            </div>
          </SelectItem>
        ))}
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
          Outros
        </div>
        {OPENROUTER_MODELS.filter(m => !['Google', 'OpenAI', 'Anthropic'].includes(m.provider)).map((model) => (
          <SelectItem key={model.id} value={model.id} className="cursor-pointer">
            <div className="flex items-center gap-2">
              {getModelIcon(model.provider)}
              <span className="font-medium">{model.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {formatContextLength(model.contextLength)}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
