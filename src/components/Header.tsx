import { Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-2xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              WebGen AI
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
