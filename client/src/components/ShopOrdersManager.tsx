import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Check, Truck } from 'lucide-react';
import * as orderService from '@/services/orderService';
import { Order } from '@/types/order';

interface ShopOrdersManagerProps {
  shopId: string;
}

const ShopOrdersManager = ({ shopId }: ShopOrdersManagerProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [shopId]);

  const fetchOrders = async () => {
    if (!shopId) return;
    
    setIsLoading(true);
    try {
      const shopOrders = await orderService.getShopOrders(shopId);
      console.log('Shop orders:', shopOrders);
      setOrders(shopOrders);
    } catch (error) {
      console.error('Error fetching shop orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load orders. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled") => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if ((order._id === orderId) || (order.id === orderId)) {
            return { ...order, status };
          }
          return order;
        })
      );
      
      toast({
        title: 'Order Updated',
        description: `Order status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status. Please try again.'
      });
    }
  };

  // Filter orders based on status
  const pendingOrders = orders.filter(order => ['pending', 'confirmed'].includes(order.status));
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => ['ready', 'delivered'].includes(order.status));

  const renderOrderActionButtons = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={() => updateOrderStatus(order._id || order.id || '', 'confirmed')}
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept Order
            </Button>
          </div>
        );
      
      case 'confirmed':
        return (
          <Button 
            onClick={() => updateOrderStatus(order._id || order.id || '', 'preparing')}
            variant="outline"
            className="border-amber-500 text-amber-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            Start Preparing
          </Button>
        );
      
      case 'preparing':
        return (
          <Button 
            onClick={() => updateOrderStatus(order._id || order.id || '', 'ready')}
            variant="outline"
            className="border-blue-500 text-blue-700"
          >
            <Truck className="h-4 w-4 mr-2" />
            Mark Ready for Delivery
          </Button>
        );
      
      case 'ready':
        return (
          <Button 
            onClick={() => updateOrderStatus(order._id || order.id || '', 'delivered')}
            variant="outline"
            className="border-green-500 text-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark as Delivered
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Order Management</h2>
        <Button onClick={fetchOrders} variant="outline">
          Refresh Orders
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center p-10">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="text-center p-10">
              <p className="text-gray-500">No orders found for your shop</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="relative">
                  New Orders
                  {pendingOrders.length > 0 && (
                    <span className="absolute top-0 right-1 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="preparing" className="relative">
                  Preparing
                  {preparingOrders.length > 0 && (
                    <span className="absolute top-0 right-1 transform translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {preparingOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ready" className="relative">
                  Ready/Delivered
                  {readyOrders.length > 0 && (
                    <span className="absolute top-0 right-1 transform translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {readyOrders.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingOrders.length === 0 ? (
                  <p className="text-center py-4">No new orders at the moment</p>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => (
                      <Card key={order._id || order.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-medium">Order #{order._id?.substring(0, 8) || order.id?.substring(0, 8)}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-2">
                              <span 
                                className={`inline-block px-2 py-1 text-xs rounded-full
                                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                   order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                                `}
                              >
                                {order.status === 'pending' ? 'New Order' : 'Confirmed'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium">Items</h4>
                            <ul className="text-sm">
                              {order.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.quantity}x {item.foodItem.name}
                                </li>
                              ))}
                            </ul>
                            <p className="text-sm font-medium mt-2">
                              Total: ${order.totalAmount.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-medium">Delivery Address</h4>
                              <p className="text-sm">{order.address}</p>
                            </div>
                            <div className="mt-3">
                              {renderOrderActionButtons(order)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preparing">
                {preparingOrders.length === 0 ? (
                  <p className="text-center py-4">No orders currently being prepared</p>
                ) : (
                  <div className="space-y-4">
                    {preparingOrders.map((order) => (
                      <Card key={order._id || order.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-medium">Order #{order._id?.substring(0, 8) || order.id?.substring(0, 8)}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                                Preparing
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium">Items</h4>
                            <ul className="text-sm">
                              {order.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.quantity}x {item.foodItem.name}
                                </li>
                              ))}
                            </ul>
                            <p className="text-sm font-medium mt-2">
                              Total: ${order.totalAmount.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-medium">Delivery Address</h4>
                              <p className="text-sm">{order.address}</p>
                            </div>
                            <div className="mt-3">
                              {renderOrderActionButtons(order)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ready">
                {readyOrders.length === 0 ? (
                  <p className="text-center py-4">No orders are ready for delivery or delivered yet</p>
                ) : (
                  <div className="space-y-4">
                    {readyOrders.map((order) => (
                      <Card key={order._id || order.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-medium">Order #{order._id?.substring(0, 8) || order.id?.substring(0, 8)}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-2">
                              <span 
                                className={`inline-block px-2 py-1 text-xs rounded-full
                                  ${order.status === 'ready' ? 'bg-blue-100 text-blue-800' : 
                                   order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                                `}
                              >
                                {order.status === 'ready' ? 'Ready for Delivery' : 'Delivered'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium">Items</h4>
                            <ul className="text-sm">
                              {order.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.quantity}x {item.foodItem.name}
                                </li>
                              ))}
                            </ul>
                            <p className="text-sm font-medium mt-2">
                              Total: ${order.totalAmount.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-medium">Delivery Address</h4>
                              <p className="text-sm">{order.address}</p>
                            </div>
                            <div className="mt-3">
                              {renderOrderActionButtons(order)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default ShopOrdersManager;
