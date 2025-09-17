import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Package, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddressSelector from '@/components/AddressSelector';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as orderService from '@/services/orderService';
import * as scheduledOrderService from '@/services/scheduledOrderService';
import * as paymentService from '@/services/paymentService';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PaymentForm from '@/components/PaymentForm';

const timeSlots = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM'
];

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cartItems, currentShop, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug logging for auth state
  console.log("CheckoutPage: Current user state:", currentUser);

  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [structuredAddress, setStructuredAddress] = useState<orderService.StructuredAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Payment processing states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Scheduling related state
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState(timeSlots[0]);

  useEffect(() => {
    // Only redirect if user is definitely not logged in
    if (currentUser === null) {
      toast({
        title: "Authentication required",
        description: "Please log in to proceed to checkout.",
        variant: "destructive"
      });
      navigate("/login?redirect=checkout");
    }
  }, [currentUser, navigate, toast]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add some items before checkout.",
        variant: "destructive"
      });
      navigate("/cart");
    }
  }, [cartItems.length, navigate, toast]);

  // Reset payment form visibility when payment method changes
  useEffect(() => {
    if (paymentMethod === 'card') {
      setShowPaymentForm(true);
    } else {
      setShowPaymentForm(false);
      setClientSecret(null);
    }
  }, [paymentMethod]);

  // Calculate total amount with delivery fee and tax
  const deliveryFee = subtotal * 0.1;
  const tax = subtotal * 0.05;
  const totalAmount = subtotal + deliveryFee + tax;

  // Handle address selection
  const handleAddressSelect = (selectedAddress: string, structured?: any) => {
    console.log("Selected address:", selectedAddress);
    console.log("Structured data:", structured);
    
    setAddress(selectedAddress);
    if (structured) {
      setStructuredAddress({
        name: structured.name,
        phone: structured.phone,
        houseNumber: structured.houseNumber,
        street: structured.street,
        landmark: structured.landmark || '',
        city: structured.city,
        state: structured.state,
        pincode: structured.pincode,
        label: structured.label
      });
    } else {
      // If we have a plain text address but no structured data
      // (this happens with manual address entry)
      setStructuredAddress(null);
    }
  };

  // Create payment intent for card payments
  const handleCreatePaymentIntent = async (orderId: string) => {
    try {
      setPaymentProcessing(true);
      const response = await paymentService.createPaymentIntent({
        totalAmount: totalAmount * 100, // Convert to cents/paise
        currency: 'inr',
        orderId
      });
      
      setClientSecret(response.clientSecret);
      console.log("Payment intent created with client secret");
      return response.clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to set up payment.",
        variant: "destructive"
      });
      setPaymentProcessing(false);
      return null;
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log("Payment succeeded with intent ID:", paymentIntentId);
    
    if (!orderId) {
      console.error("Order ID is missing");
      return;
    }
    
    try {
      await paymentService.handleSuccessfulPayment(orderId, paymentIntentId);
      
      toast({
        title: "Payment Successful",
        description: "Your order has been placed and payment has been processed.",
      });
      
      // Clear cart and redirect to orders page
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Payment Confirmation Error",
        description: "Your payment went through, but we couldn't update your order. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    console.error("Payment error:", errorMessage);
    toast({
      title: "Payment Failed",
      description: errorMessage || "There was an issue processing your payment. Please try again.",
      variant: "destructive"
    });
    setPaymentProcessing(false);
  };

  // Place order function
  const handlePlaceOrder = async () => {
    // Always check if user is logged in first
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order.",
        variant: "destructive"
      });
      navigate("/login?redirect=checkout");
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please provide a delivery address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        customerId: currentUser.id || currentUser._id,
        shopId: currentShop || '',
        items: cartItems.map(item => ({
          foodItem: item.id,
          quantity: item.quantity
        })),
        totalAmount,
        address,
        structuredAddress,
        paymentMethod: paymentMethod as 'card' | 'upi' | 'cod' | 'wallet'
      };

      console.log("Submitting order with data:", orderData);
      
      let createdOrder;
      
      if (scheduleForLater && scheduledDate) {
        // Format the scheduled date and time
        const scheduledDateTime = new Date(scheduledDate);
        const [hours, minutes] = scheduledTime.match(/(\d+):(\d+)/)?.slice(1) || [];
        const isPM = scheduledTime.includes('PM');
        
        scheduledDateTime.setHours(
          isPM ? (parseInt(hours) === 12 ? 12 : parseInt(hours) + 12) : (parseInt(hours) === 12 ? 0 : parseInt(hours)),
          parseInt(minutes),
          0,
          0
        );

        // Create scheduled order
        const scheduledOrderData = {
          ...orderData,
          scheduledFor: scheduledDateTime.toISOString()
        };

        createdOrder = await scheduledOrderService.createScheduledOrder(scheduledOrderData);
        
        // Only show this toast if not using card payment (which has its own flow)
        if (paymentMethod !== 'card') {
          toast({
            title: "Order scheduled",
            description: `Your order has been scheduled for ${format(scheduledDateTime, 'PPP')} at ${scheduledTime}`,
          });
        }
      } else {
        // Create regular order
        createdOrder = await orderService.createOrder(orderData);
        
        // Only show this toast if not using card payment (which has its own flow)
        if (paymentMethod !== 'card') {
          toast({
            title: "Order placed",
            description: "Your order has been placed successfully.",
          });
        }
      }
      
      // Store the order ID for later use
      setOrderId(createdOrder._id || createdOrder.id);

      if (paymentMethod === 'card') {
        // If card payment, create a payment intent
        await handleCreatePaymentIntent(createdOrder._id || createdOrder.id);
      } else {
        // If not card payment, complete the order process
        clearCart();
        navigate('/orders');
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order.",
        variant: "destructive"
      });
      setIsLoading(false);
    } finally {
      // Only set loading to false if not processing card payment
      if (paymentMethod !== 'card') {
        setIsLoading(false);
      }
    }
  };

  // Show loading state while auth state is initializing
  if (currentUser === undefined) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <p>Loading checkout...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Complete your order details below
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="md:col-span-2">
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded overflow-hidden mr-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}

                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Delivery Address */}
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                {currentUser && currentUser.id ? (
                  <AddressSelector 
                    onSelectAddress={handleAddressSelect}
                    selectedAddress={address}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p>Please log in to select or add an address.</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate("/login?redirect=checkout")}
                    >
                      Log In
                    </Button>
                  </div>
                )}
              </Card>

              {/* Schedule Order */}
              <Card className="p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Delivery Time</h2>
                  <div className="flex items-center">
                    <label htmlFor="schedule-toggle" className="mr-2">Schedule for later</label>
                    <Switch 
                      id="schedule-toggle" 
                      checked={scheduleForLater}
                      onCheckedChange={setScheduleForLater}
                    />
                  </div>
                </div>
                
                {scheduleForLater ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label>Select Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal mt-1"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduledDate ? format(scheduledDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label>Select Time</label>
                        <select
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full h-10 mt-1 px-3 py-2 bg-background border border-input rounded-md"
                        >
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-md mt-2">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p className="text-sm">
                        Your order will be prepared and delivered at the scheduled time.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <p>Your order will be delivered as soon as possible.</p>
                  </div>
                )}
              </Card>
              
              {/* Payment Form (shown only when card payment is selected and payment intent is created) */}
              {showPaymentForm && clientSecret ? (
                <Card className="p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                  <PaymentForm
                    amount={totalAmount * 100} // In cents
                    clientSecret={clientSecret}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    isLoading={paymentProcessing}
                  />
                </Card>
              ) : null}
            </div>

            {/* Payment Method & Place Order */}
            <div className="md:col-span-1">
              <Card className="p-6 mb-8 sticky top-20">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                
                <RadioGroup 
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value="card" id="payment-card" />
                    <label htmlFor="payment-card" className="cursor-pointer">Credit/Debit Card</label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value="cod" id="payment-cod" />
                    <label htmlFor="payment-cod" className="cursor-pointer">Cash on Delivery</label>
                  </div>
                </RadioGroup>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={handlePlaceOrder}
                  disabled={isLoading || !address.trim() || Boolean(showPaymentForm && clientSecret)}
                >
                  {isLoading ? "Processing..." : 
                   paymentMethod === 'card' && !clientSecret ? "Continue to Payment" : 
                   scheduleForLater ? "Schedule Order" : "Place Order"}
                </Button>
                
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
