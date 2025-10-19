import React from 'react';
import { StackDetector } from '@/lib/prompts/stackDetector';
import { ProjectStack } from '@/lib/prompts';

interface AutoStackDetectionProps {
  description: string;
  detectedStack: ProjectStack | null;
  confidence: number;
  reason: string;
  className?: string;
}

export const AutoStackDetection: React.FC<AutoStackDetectionProps> = ({
  description,
  detectedStack,
  confidence,
  reason,
  className = ''
}) => {
  if (!detectedStack) return null;

  const stackInfo = StackDetector.getStackInfo(detectedStack);
  const confidenceColor = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-orange-600';
  const confidenceText = confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Média' : 'Baixa';

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xl">{stackInfo.icon}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-semibold text-blue-900">
              🤖 Stack Detectada Automaticamente
            </h4>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${confidenceColor} ${
              confidence >= 0.8 ? 'bg-green-100' : confidence >= 0.6 ? 'bg-yellow-100' : 'bg-orange-100'
            }`}>
              {confidenceText} ({Math.round(confidence * 100)}%)
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-800">
              {stackInfo.name}
            </p>
            <p className="text-xs text-blue-600">
              {stackInfo.description}
            </p>
            <p className="text-xs text-blue-500 italic">
              💡 {reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StackSuggestionsProps {
  description: string;
  onStackSelect: (stack: ProjectStack) => void;
  className?: string;
}

export const StackSuggestions: React.FC<StackSuggestionsProps> = ({
  description,
  onStackSelect,
  className = ''
}) => {
  const suggestions = StackDetector.getStackSuggestions(description);

  if (suggestions.length <= 1) return null; // Only show if there are alternatives

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
        <span>🔄</span>
        <span>Outras opções detectadas:</span>
      </h4>
      <div className="space-y-2">
        {suggestions.slice(1).map((suggestion, index) => {
          const stackInfo = StackDetector.getStackInfo(suggestion.stack);
          return (
            <button
              key={index}
              onClick={() => onStackSelect(suggestion.stack)}
              className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{stackInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stackInfo.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
