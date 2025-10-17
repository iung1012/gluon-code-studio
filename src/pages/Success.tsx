import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";

const Success = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-primary/10 rounded-full p-3 w-fit">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">Pagamento Realizado!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Sua assinatura foi confirmada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Bem-vindo ao Plano PRO da 2CODE! Agora você tem acesso ilimitado a todos os recursos da plataforma.
              </p>
              <Button
                onClick={() => navigate("/")}
                className="w-full"
                size="lg"
              >
                Começar a Usar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Success;
