
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionButtonProps {
  versionNumber: number;
  isActive: boolean;
  onRestore: () => void;
  timestamp: Date;
}

export const VersionButton = ({ versionNumber, isActive, onRestore, timestamp }: VersionButtonProps) => {
  return (
    <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-foreground">
            Versão {versionNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        <Button
          size="sm"
          variant={isActive ? "default" : "outline"}
          onClick={onRestore}
          disabled={isActive}
          className={cn(
            "h-8 px-3 gap-1.5",
            isActive && "bg-primary text-primary-foreground"
          )}
        >
          {isActive ? (
            <>
              <Check className="w-3 h-3" />
              Atual
            </>
          ) : (
            <>
              <RotateCcw className="w-3 h-3" />
              Restaurar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
