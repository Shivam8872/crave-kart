
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import ShopHero from "@/components/shop/ShopHero";
import ShopMenu from "@/components/shop/ShopMenu";
import ShopOffers from "@/components/shop/ShopOffers";
import * as shopService from "@/services/shopService";
import ReviewsSection from '@/components/ReviewsSection';

const ShopDetails = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [shopOffers, setShopOffers] = useState([]);
  const [activeTab, setActiveTab] = useState("menu"); // Added for tab navigation

  useEffect(() => {
    if (!shopId) return;

    const fetchShop = async () => {
      setIsLoading(true);
      try {
        const shopData = await shopService.getShopById(shopId);
        setShop(shopData);
        
        // Check if current user is the shop owner
        // This would use auth context in a real implementation
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setIsShopOwner(user.ownedShopId === shopId);
        }
        
        // Fetch menu items for the shop
        const items = await shopService.getShopFoodItems(shopId);
        setMenuItems(items);
        
        // Fetch offers for the shop
        const offers = await shopService.getShopOffers(shopId);
        setShopOffers(offers);
      } catch (error) {
        console.error("Error fetching shop:", error);
        toast({
          variant: "destructive",
          title: "Failed to load shop",
          description: "Could not retrieve shop details. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [shopId, toast]);

  // Extract categories from menu items
  const shopCategories = shop?.categories || [];

  // Function to change active tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <Layout>
      <div className="animate-in fade-in duration-700">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-50 dark:bg-gray-900/90 z-0"
            style={{
              backgroundImage: shop?.coverImage 
                ? `url(${shop.coverImage})` 
                : "url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80)",
              filter: "blur(10px)",
              opacity: 0.3,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 py-8 pb-20">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-56 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </div>
            </div>
          ) : shop ? (
            <>
              <ShopHero 
                shop={shop} 
                categories={shopCategories}
                isShopOwner={isShopOwner}
                shopId={shop._id || shop.id}
              />
              
              {/* Tab navigation */}
              <div className="mt-8 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    className={`pb-4 px-1 font-medium text-sm ${
                      activeTab === "menu"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    onClick={() => handleTabChange("menu")}
                  >
                    Menu
                  </button>
                  <button
                    className={`pb-4 px-1 font-medium text-sm ${
                      activeTab === "reviews"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    onClick={() => handleTabChange("reviews")}
                  >
                    Reviews
                  </button>
                  <button
                    className={`pb-4 px-1 font-medium text-sm ${
                      activeTab === "info"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    onClick={() => handleTabChange("info")}
                  >
                    Information
                  </button>
                </nav>
              </div>
              
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-8">
                  {/* Menu Tab Content */}
                  {activeTab === "menu" && (
                    <ShopMenu 
                      items={menuItems} 
                      shopId={shop._id || shop.id}
                      isShopOwner={isShopOwner}
                    />
                  )}
                  
                  {/* Reviews Tab Content */}
                  {activeTab === "reviews" && (
                    <ReviewsSection shopId={shop._id || shop.id} />
                  )}
                  
                  {/* Info Tab Content */}
                  {activeTab === "info" && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h2 className="text-2xl font-semibold mb-4">About {shop.name}</h2>
                      <p className="mb-4 text-gray-700 dark:text-gray-300">{shop.description}</p>
                      
                      <div className="mt-6">
                        <h3 className="text-xl font-medium mb-3">Business Hours</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Monday - Friday</span>
                            <span>9:00 AM - 10:00 PM</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Saturday</span>
                            <span>10:00 AM - 11:00 PM</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Sunday</span>
                            <span>11:00 AM - 9:00 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-8">
                  {/* Shop Contact Card */}
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <h3 className="text-xl font-semibold">Contact Us</h3>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {shop.address || "No address provided"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {shop.phone || "No phone provided"}
                        </p>
                      </div>
                      <Button variant="outline" className="w-full justify-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <ShopOffers offers={shopOffers} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold">Shop Not Found</h2>
              <p className="text-gray-500">
                Sorry, we couldn't find the shop you were looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ShopDetails;
