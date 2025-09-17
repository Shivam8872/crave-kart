
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Package } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import OrderHistory from "@/components/OrderHistory";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SavedAddresses from "@/components/SavedAddresses";
import ScheduledOrders from "@/components/ScheduledOrders";

const OrdersPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your orders.",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    setIsLoading(false);
  }, [currentUser, navigate, toast]);

  if (isLoading) return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!currentUser) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold">Your Orders</h1>
          </div>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="mb-6 w-full flex flex-wrap gap-2">
              <TabsTrigger value="current" className="flex-1">
                <Package className="h-4 w-4 mr-2 hidden sm:inline-block" /> 
                <span className="sm:inline">Current Orders</span>
                <span className="sm:hidden">Current</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex-1">
                <Clock className="h-4 w-4 mr-2 hidden sm:inline-block" /> 
                <span className="sm:inline">Scheduled Orders</span>
                <span className="sm:hidden">Scheduled</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2 hidden sm:inline-block" /> 
                <span className="sm:inline">Saved Addresses</span>
                <span className="sm:hidden">Addresses</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="current">
              <OrderHistory />
            </TabsContent>
            
            <TabsContent value="scheduled">
              <ScheduledOrders />
            </TabsContent>
            
            <TabsContent value="addresses">
              <SavedAddresses />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;
