import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="2code Logo" className="h-7 sm:h-8 w-auto" />
          </button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 sm:gap-2 px-2 sm:px-3"
                >
                  <Avatar className="w-6 h-6 sm:w-7 sm:h-7">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs sm:text-sm">
                    {user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Minha Conta</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/auth")}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
