
import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, MapPin, Package, ShoppingBag, Truck } from "lucide-react";
import { Order } from '@/types/order';

interface OrderTrackingProps {
  order: Order;
}

// Define the order status stages for the progress tracking
const ORDER_STAGES = [
  { status: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { status: 'confirmed', label: 'Order Confirmed', icon: Package },
  { status: 'preparing', label: 'Preparing', icon: ShoppingBag },
  { status: 'ready', label: 'Ready for Pickup', icon: Package },
  { status: 'delivered', label: 'Delivered', icon: Truck }
];

// Function to get the current progress of the order
const getOrderProgress = (status: string): number => {
  const index = ORDER_STAGES.findIndex(stage => stage.status === status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / ORDER_STAGES.length) * 100);
};

const OrderTracking = ({ order }: OrderTrackingProps) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [currentProgress, setCurrentProgress] = useState(() => getOrderProgress(order.status));
  const [estimatedTime, setEstimatedTime] = useState<number>(() => {
    // Calculate estimated delivery time based on order status
    switch(order.status) {
      case 'pending': return 45;
      case 'confirmed': return 35;
      case 'preparing': return 25;
      case 'ready': return 15;
      default: return 0;
    }
  });

  // For map container
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // Simulate real-time updates for demo purposes
  useEffect(() => {
    // Only simulate updates for non-delivered orders
    if (order.status === 'delivered' || order.status === 'cancelled') return;
    
    const timer = setInterval(() => {
      // Decrease estimated time
      setEstimatedTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      
      // Randomly update order status for demo
      if (Math.random() > 0.95) {
        const currentIndex = ORDER_STAGES.findIndex(stage => stage.status === currentStatus);
        if (currentIndex < ORDER_STAGES.length - 1) {
          const newStatus = ORDER_STAGES[currentIndex + 1].status;
          setCurrentStatus(newStatus as Order['status']);
          setCurrentProgress(getOrderProgress(newStatus));
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [order.status, currentStatus]);

  // Get the current stage information
  const currentStage = ORDER_STAGES.find(stage => stage.status === currentStatus) || ORDER_STAGES[0];
  const CurrentIcon = currentStage.icon;
  
  // For demonstration purposes, we'll just show a placeholder for the map
  // In a real application, this would be integrated with Google Maps, Mapbox, etc.
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // In a real app, you would initialize a map here
    const mapPlaceholder = document.createElement('div');
    mapPlaceholder.className = 'flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-md';
    mapPlaceholder.innerHTML = `
      <div class="text-center">
        <MapPin class="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p class="text-sm text-gray-500">Real-time tracking map would display here</p>
        <p class="text-xs text-gray-400">Connect a mapping API like Google Maps or Mapbox</p>
      </div>
    `;
    mapContainer.current.innerHTML = '';
    mapContainer.current.appendChild(mapPlaceholder);
    
    return () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Tracking</h3>
      
      <Card className="p-4">
        <div className="space-y-4">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-full">
                <CurrentIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{currentStage.label}</p>
                <p className="text-sm text-gray-500">Order #{order._id || order.id}</p>
              </div>
            </div>
            {estimatedTime > 0 && (
              <div className="text-right">
                <p className="text-sm font-medium">Estimated Time</p>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{estimatedTime} minutes</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={currentProgress} className="h-2" />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Order Placed</span>
              <span>Preparing</span>
              <span>Delivered</span>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="mt-4">
            <div
              ref={mapContainer}
              className="h-48 md:h-64 bg-gray-100 dark:bg-gray-800 rounded-md border"
            />
          </div>
          
          {/* Delivery Address */}
          <div className="flex items-start space-x-3 mt-4 pt-4 border-t">
            <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">Delivery Address</p>
              <p className="text-sm text-gray-500">{order.address}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderTracking;
