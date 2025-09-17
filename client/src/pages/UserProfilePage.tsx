
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Store, WifiOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import AddressManager from "@/components/AddressManager";
import NotificationSettings from "@/components/NotificationSettings";
import FavoriteItems from "@/components/FavoriteItems";
import OrderHistory from "@/components/OrderHistory";
import * as shopService from "@/services/shopService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const UserProfilePage = () => {
  const { currentUser, getUserOwnedShop, refreshUserShop, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [userShop, setUserShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shopDataFetched, setShopDataFetched] = useState(false);
  const [isFetchingShop, setIsFetchingShop] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // Memoized shop data loading function
  const loadUserShop = useCallback(async () => {
    setIsFetchingShop(true);
    setIsLoading(true);
    setNetworkError(false);
    
    try {
      // Check if we already have shop data in context
      const contextShop = getUserOwnedShop();
      if (contextShop && (contextShop.id || contextShop._id)) {
        console.log("UserProfile: Using shop from context:", contextShop);
        setUserShop(contextShop);
        setShopDataFetched(true);
        setIsLoading(false);
        setIsFetchingShop(false);
        return;
      }
      
      // Only attempt to load shop data if user is a shop owner with ownedShopId
      if (currentUser?.userType === "shopOwner" && currentUser.ownedShopId) {
        console.log("UserProfile: Loading user shop data");
        
        // First try refreshing shop data (but don't wait for it)
        refreshUserShop().catch(console.error);
        
        // Get shop data from auth context (in case refresh was quick)
        const shop = getUserOwnedShop();
        if (shop && (shop.id || shop._id)) {
          console.log("UserProfile: Setting shop from context:", shop);
          setUserShop(shop);
          setShopDataFetched(true);
          setIsFetchingShop(false);
          setIsLoading(false);
          return;
        }
        
        // If still no shop data, fetch directly from API
        console.log("UserProfile: Fetching shop directly with ID:", currentUser.ownedShopId);
        try {
          const fetchedShop = await shopService.getShopById(currentUser.ownedShopId, currentUser.id);
          if (fetchedShop) {
            console.log("UserProfile: Directly fetched shop:", fetchedShop);
            setUserShop({
              ...fetchedShop,
              id: fetchedShop._id || fetchedShop.id
            });
            setShopDataFetched(true);
          }
        } catch (error) {
          console.error("UserProfile: Error fetching shop:", error);
          setNetworkError(true);
          // Show a toast notification about the error
          toast({
            variant: "destructive",
            title: "Network Error",
            description: "Failed to connect to the server. Please check your connection."
          });
        }
      }
    } catch (error) {
      console.error("Error loading user shop:", error);
      setNetworkError(true);
    } finally {
      setIsLoading(false);
      setIsFetchingShop(false);
    }
  }, [currentUser, getUserOwnedShop, refreshUserShop, toast]);
  
  // Handle retry logic
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setShopDataFetched(false);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Skip if we're already fetching or have fetched shop data
    if (shopDataFetched || isFetchingShop || currentUser.userType !== "shopOwner") {
      setIsLoading(false);
      return;
    }
    
    loadUserShop();
  }, [currentUser, getUserOwnedShop, refreshUserShop, navigate, toast, shopDataFetched, isFetchingShop, loadUserShop, retryCount]);
  
  // Check if user has a shop and determine its status
  const hasApprovedShop = userShop && userShop.status === 'approved';
  const hasPendingShop = userShop && userShop.status === 'pending';
  const hasRejectedShop = userShop && userShop.status === 'rejected';
  
  console.log("UserProfile: Has approved shop:", hasApprovedShop);
  console.log("UserProfile: Has pending shop:", hasPendingShop);
  console.log("UserProfile: Has rejected shop:", hasRejectedShop);
  console.log("UserProfile: Current shop status:", userShop?.status);

  if (!currentUser) return null;

  // Handle the shop dashboard navigation
  const handleManageShopClick = () => {
    console.log("Navigating to shop dashboard with shop ID:", userShop?.id);
    toast({
      title: "Navigating to shop dashboard",
      description: "Opening your shop management dashboard"
    });
    navigate("/shop-dashboard");
  };

  // Display network error UI
  if (networkError && currentUser.userType === "shopOwner") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
            <WifiOff className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't connect to the server to load your shop data. This might be due to network issues or the server might be temporarily unavailable.
            </p>
            <Button 
              onClick={handleRetry} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Trying..." : "Retry Connection"}
            </Button>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => setActiveTab("profile")}
            >
              Continue to Profile
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        {isLoading ? (
          // Show skeleton UI while loading
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-1/5" />
              <Skeleton className="h-10 w-1/5" />
              <Skeleton className="h-10 w-1/5" />
              <Skeleton className="h-10 w-1/5" />
              <Skeleton className="h-10 w-1/5" />
            </div>
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-2xl font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold">{currentUser.name || "User"}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{currentUser.email}</p>
                    <p className="text-sm font-medium mt-1">
                      Account Type: {currentUser.userType === "shopOwner" ? "Shop Owner" : "Customer"}
                    </p>
                  </div>
                </div>
                {currentUser.userType === "shopOwner" && (
                  <div>
                    {hasApprovedShop ? (
                      <Button 
                        onClick={handleManageShopClick} 
                        className="flex items-center gap-2 btn-primary"
                      >
                        <Store className="h-4 w-4" />
                        Manage Shop
                      </Button>
                    ) : hasPendingShop ? (
                      <Button disabled className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 cursor-not-allowed">
                        <Store className="h-4 w-4" />
                        Shop Pending Approval
                      </Button>
                    ) : hasRejectedShop ? (
                      <Button 
                        onClick={handleManageShopClick} 
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600"
                      >
                        <Store className="h-4 w-4" />
                        Shop Rejected - Edit Details
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => navigate("/register-shop")} 
                        className="flex items-center gap-2 btn-primary"
                      >
                        <Plus className="h-4 w-4" />
                        Register Shop
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-8">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h4>
                      <p className="mt-1">{currentUser.name || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h4>
                      <p className="mt-1">{currentUser.email}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</h4>
                      <p className="mt-1">{currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "Unknown"}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t">
                      <Button 
                        variant="destructive" 
                        className="w-full sm:w-auto" 
                        onClick={() => {
                          logout();
                          navigate("/login");
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="addresses">
                <AddressManager />
              </TabsContent>
              
              <TabsContent value="favorites">
                <FavoriteItems />
              </TabsContent>
              
              <TabsContent value="notifications">
                <NotificationSettings />
              </TabsContent>
              
              <TabsContent value="orders">
                <OrderHistory />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserProfilePage;
