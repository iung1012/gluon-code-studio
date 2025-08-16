
import { CheckCircle, Zap, Palette, Type, Layout } from "lucide-react";
import { cn } from "@/lib/utils";

interface Improvement {
  id: string;
  type: 'modification' | 'enhancement' | 'fix';
  element?: string;
  description: string;
  timestamp: Date;
}

interface ImprovementHistoryProps {
  improvements: Improvement[];
  className?: string;
}

export const ImprovementHistory = ({ improvements, className }: ImprovementHistoryProps) => {
  if (improvements.length === 0) return null;

  const getImprovementIcon = (type: string, element?: string) => {
    if (element) {
      switch (element.toLowerCase()) {
        case 'button':
          return <Zap className="w-4 h-4 text-blue-500" />;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'p':
        case 'span':
          return <Type className="w-4 h-4 text-green-500" />;
        case 'div':
        case 'section':
          return <Layout className="w-4 h-4 text-purple-500" />;
        default:
          return <Palette className="w-4 h-4 text-orange-500" />;
      }
    }
    
    switch (type) {
      case 'enhancement':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'fix':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Palette className="w-4 h-4 text-purple-500" />;
    }
  };

  const getImprovementColor = (type: string) => {
    switch (type) {
      case 'enhancement':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'fix':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-purple-50 border-purple-200 text-purple-800';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-slate-700 mb-3">Melhorias Recentes</h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {improvements.slice(0, 5).map((improvement) => (
          <div
            key={improvement.id}
            className={cn(
              "flex items-start gap-2 p-2 rounded-lg border text-xs",
              getImprovementColor(improvement.type)
            )}
          >
            {getImprovementIcon(improvement.type, improvement.element)}
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">
                {improvement.element && (
                  <span className="uppercase font-bold mr-1">
                    {improvement.element}:
                  </span>
                )}
                {improvement.description}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {improvement.timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
