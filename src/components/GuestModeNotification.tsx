import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';

interface GuestModeNotificationProps {
  onDisableGuestMode: () => void;
}

export const GuestModeNotification: React.FC<GuestModeNotificationProps> = ({
  onDisableGuestMode
}) => {
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <User className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <span>
            Você está usando o <strong>modo convidado</strong>. 
            Para salvar projetos e acessar recursos premium, 
            <a href="/auth" className="underline ml-1">faça login</a>.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisableGuestMode}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
