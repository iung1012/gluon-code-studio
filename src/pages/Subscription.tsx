import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";

const Subscription = () => {
  const { subscribed, loading: subLoading, checkSubscription, user } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    is_subscribed: boolean;
    subscription_product_id: string | null;
    subscription_end: string | null;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSubscriptionDetails = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_product_id, subscription_end')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setSubscriptionDetails(data);
      }
    };

    loadSubscriptionDetails();
  }, [user, subscribed]);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para assinar",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o processo de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // Se não houver customer no Stripe, mostra mensagem informativa
        toast({
          title: "Informação",
          description: "Sua assinatura está ativa. Para alterações, entre em contato com o suporte.",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao acessar o portal de gerenciamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ilimitado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const features = [
    "Geração ilimitada de sites",
    "Todos os modelos AI disponíveis",
    "Suporte prioritário",
    "Atualizações automáticas",
    "Histórico completo de projetos",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Plano PRO</h1>
            <p className="text-muted-foreground text-lg">
              Acesso completo à plataforma 2CODE
            </p>
          </div>

          <Card className={subscribed ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl">Plano PRO</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    R$ 49,90/mês
                  </CardDescription>
                </div>
                {subscribed && (
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold">
                    Seu Plano
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-1">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 space-y-3">
                {!subscribed ? (
                  <Button
                    onClick={handleCheckout}
                    disabled={loading || subLoading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Assinar Agora"
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loading || subLoading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Gerenciar Pagamento
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={checkSubscription}
                      disabled={subLoading}
                      className="w-full"
                      variant="secondary"
                    >
                      {subLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        "Atualizar Status"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da Assinatura Card */}
          {subscribed && subscriptionDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Detalhes da Assinatura</CardTitle>
                <CardDescription>Informações sobre seu plano atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Status</div>
                    <div className="text-sm text-muted-foreground">Assinatura Ativa</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Validade</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(subscriptionDetails.subscription_end)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Plano</div>
                    <div className="text-sm text-muted-foreground">PRO - Acesso Total</div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Para cancelar ou modificar sua assinatura, utilize o botão "Gerenciar Pagamento" ou entre em contato com o suporte.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
