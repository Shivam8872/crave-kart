
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as orderService from '@/services/orderService';
import { Button } from './ui/button';
import { Clock, Check, Truck, Package, AlertTriangle } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await orderService.getUserOrders(currentUser.id);
        console.log("Fetched orders:", fetchedOrders);
        setOrders(fetchedOrders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          variant: "destructive",
          title: "Failed to fetch orders",
          description: "Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-6 md:p-10">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No Orders Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't placed any orders yet.</p>
        <Button 
          className="bg-red-500 hover:bg-red-600 text-white transition-colors" 
          variant="default"
        >
          Browse Shops
        </Button>
      </div>
    );
  }

  // Get status icon based on order status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <Check className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'ready':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status color based on order status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const orderId = order._id || order.id;
        const orderDate = new Date(order.createdAt);
        const shopName = typeof order.shop === 'string' 
          ? 'Shop' 
          : (order.shop?.name || 'Shop');
        const shopLogo = typeof order.shop === 'string'
          ? null
          : order.shop?.logo;

        return (
          <Card key={orderId} className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="border-b p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center">
                    {shopLogo ? (
                      <img 
                        src={shopLogo} 
                        alt={shopName} 
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-500 font-semibold">
                          {shopName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{shopName}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {orderDate.toLocaleDateString()} at {orderDate.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      <span className="mr-1.5">{getStatusIcon(order.status)}</span>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Items</h4>
                  <ul className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between text-sm sm:text-base">
                        <div className="text-gray-800 dark:text-gray-200">
                          <span className="font-medium">{item.quantity}x</span>{' '}
                          <span className="text-gray-700 dark:text-gray-300">{item.foodItem.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 ml-2">
                          ${(item.foodItem.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t mt-3 pt-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${order.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="border-t mt-4 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Details</h4>
                  <div className="space-y-3 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-gray-600 dark:text-gray-400 sm:w-32">Delivery To:</span>
                      <span className="text-gray-800 dark:text-gray-200 flex-1">{order.address}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-gray-600 dark:text-gray-400 sm:w-32">Payment:</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                         order.paymentMethod === 'card' ? 'Credit/Debit Card' : 
                         order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OrderHistory;
