
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Package, 
  Clock,
  Users
} from "lucide-react";
import * as orderService from '@/services/orderService';
import { Order } from '@/types/order';

interface ShopAnalyticsProps {
  shopId: string;
}

const ShopAnalytics = ({ shopId }: ShopAnalyticsProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [shopId]);

  const fetchOrders = async () => {
    if (!shopId) return;
    
    setIsLoading(true);
    try {
      const shopOrders = await orderService.getShopOrders(shopId);
      setOrders(shopOrders);
    } catch (error) {
      console.error('Error fetching shop orders for analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load orders data. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    if (!orders.length) return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      completionRate: 0,
      topItems: []
    };

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalRevenue / totalOrders;
    
    const completedOrders = orders.filter(order => 
      order.status === 'delivered' || order.status === 'ready'
    ).length;
    const completionRate = (completedOrders / totalOrders) * 100;
    
    // Find top selling items
    const itemsCount: Record<string, { name: string, count: number, revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemName = typeof item.foodItem === 'object' ? item.foodItem.name : 'Unknown Item';
        const itemPrice = typeof item.foodItem === 'object' ? item.foodItem.price : item.price;
        
        if (!itemsCount[itemName]) {
          itemsCount[itemName] = { name: itemName, count: 0, revenue: 0 };
        }
        
        itemsCount[itemName].count += item.quantity;
        itemsCount[itemName].revenue += item.quantity * itemPrice;
      });
    });
    
    const topItems = Object.values(itemsCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      completionRate,
      topItems
    };
  };

  // Get sales data by time period
  const getSalesData = () => {
    // Group by date
    const salesByDate: Record<string, { date: string, revenue: number, orders: number }> = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { 
          date: dateKey, 
          revenue: 0, 
          orders: 0 
        };
      }
      
      salesByDate[dateKey].revenue += order.totalAmount;
      salesByDate[dateKey].orders += 1;
    });
    
    // Convert to array and sort by date
    return Object.values(salesByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  };

  // Get peak order times data
  const getPeakTimesData = () => {
    const hourCounts = Array(24).fill(0);
    
    orders.forEach(order => {
      const orderHour = new Date(order.createdAt).getHours();
      hourCounts[orderHour]++;
    });
    
    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      orders: count
    }));
  };

  // Get order status distribution
  const getOrderStatusDistribution = () => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const metrics = calculateMetrics();
  const salesData = getSalesData();
  const peakTimesData = getPeakTimesData();
  const statusData = getOrderStatusDistribution();

  if (isLoading) {
    return (
      <div className="text-center p-10">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Shop Analytics</h2>
        <button 
          onClick={fetchOrders}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1">${metrics.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.totalOrders}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Order</p>
              <h3 className="text-2xl font-bold mt-1">${metrics.averageOrderValue.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <BarChartIcon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.completionRate.toFixed(1)}%</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="items">Items Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Orders Status Distribution</h3>
              <div className="h-[300px]">
                <PieChart 
                  data={statusData} 
                  index="name"
                  valueKey="value"
                  colors={["#FCD34D", "#60A5FA", "#F472B6", "#34D399", "#6EE7B7", "#F87171"]}
                />
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Peak Order Times</h3>
              <div className="h-[300px]">
                <BarChart 
                  data={peakTimesData} 
                  index="hour"
                  categories={["orders"]}
                  colors={["#8B5CF6"]}
                  showLegend={false}
                  showAnimation={true}
                />
              </div>
            </Card>
          </div>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Top Selling Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left">Item</th>
                    <th className="py-2 px-3 text-right">Units Sold</th>
                    <th className="py-2 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topItems.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3 text-right">{item.count}</td>
                      <td className="py-2 px-3 text-right">${item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales" className="pt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Revenue Trends (Last 14 Days)</h3>
            <div className="h-[400px]">
              <LineChart 
                data={salesData} 
                index="date"
                categories={["revenue"]}
                colors={["#8B5CF6"]}
                valueFormatter={(value) => `$${value.toFixed(2)}`}
                showYAxis={true}
                showGradient={true}
                startEndOnly={true}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="items" className="pt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Items Performance</h3>
            <div className="h-[400px]">
              <BarChart 
                data={metrics.topItems} 
                index="name"
                categories={["count"]}
                colors={["#8B5CF6"]}
                showXAxis={true}
                showYAxis={true}
                showAnimation={true}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopAnalytics;
