
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, ChevronUp, MapPin, Package, MessageSquare } from "lucide-react";
import { Order } from '@/types/order';
import { Collapse } from '@/components/ui/collapse';
import { formatDistanceToNow } from 'date-fns';
import OrderTracking from './OrderTracking';

interface OrderDetailCardProps {
  order: Order;
  showTracking?: boolean;
}

const OrderDetailCard = ({ order, showTracking = true }: OrderDetailCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showTrackingMap, setShowTrackingMap] = useState(false);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Format order date
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString();
  const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeAgo = formatDistanceToNow(orderDate, { addSuffix: true });

  // Get shop details
  const shopName = typeof order.shop === 'string' ? 'Shop' : (order.shop.name || 'Shop');
  const shopLogo = typeof order.shop === 'string' ? null : order.shop.logo;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
        <div className="flex items-center">
          {shopLogo ? (
            <img 
              src={shopLogo} 
              alt={shopName} 
              className="h-8 w-8 rounded-full object-cover mr-3" 
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Package className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="font-medium">{shopName}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formattedDate} at {formattedTime}</span>
            </div>
          </div>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>
      
      {/* Order Summary */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm text-gray-500">Order #{order._id || order.id}</p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
          <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
        </div>
        
        <div className="mt-3 flex items-start">
          <MapPin className="h-4 w-4 text-gray-500 mt-1 mr-2 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{order.address}</p>
        </div>
        
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 flex items-center justify-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              <span>View details</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
      
      {/* Expanded Details */}
      <Collapse open={expanded}>
        <div className="p-4 space-y-4">
          {/* Items */}
          <div>
            <h4 className="font-medium mb-2">Order Items</h4>
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {typeof item.foodItem === 'object' && item.foodItem.image && (
                      <img 
                        src={item.foodItem.image} 
                        alt={typeof item.foodItem === 'object' ? item.foodItem.name : 'Food item'} 
                        className="h-8 w-8 rounded object-cover mr-3" 
                      />
                    )}
                    <span>
                      {item.quantity} × {typeof item.foodItem === 'object' ? item.foodItem.name : 'Item'}
                    </span>
                  </div>
                  <span className="font-medium">
                    ${typeof item.foodItem === 'object' && item.foodItem.price 
                      ? (item.foodItem.price * item.quantity).toFixed(2)
                      : item.price.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Payment Info */}
          <div className="pt-3 border-t">
            <div className="flex justify-between mb-1">
              <span>Subtotal</span>
              <span>${(order.totalAmount * 0.85).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Delivery Fee</span>
              <span>${(order.totalAmount * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Tax</span>
              <span>${(order.totalAmount * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between pt-3 border-t">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Shop
            </Button>
            {showTracking && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Button 
                size="sm" 
                onClick={() => setShowTrackingMap(!showTrackingMap)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {showTrackingMap ? 'Hide Tracking' : 'Track Order'}
              </Button>
            )}
          </div>
          
          {/* Tracking Map */}
          {showTrackingMap && showTracking && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="mt-4 pt-4 border-t">
              <OrderTracking order={order} />
            </div>
          )}
        </div>
      </Collapse>
    </Card>
  );
};

export default OrderDetailCard;
