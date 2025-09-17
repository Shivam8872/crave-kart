
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  houseNumber: string; // Address line 1
  street: string;
  landmark?: string; // Address line 2 (optional)
  city: string;
  state: string;
  pincode: string;
  label: "home" | "work" | "other";
  isDefault: boolean;
}

interface AddressSelectorProps {
  onSelectAddress: (address: string, structuredAddress?: any) => void;
  selectedAddress?: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number should be at least 10 digits"),
  houseNumber: z.string().min(1, "Address line 1 is required"),
  street: z.string().min(1, "Street is required"),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(4, "Valid pincode is required"),
  label: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false)
});

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  onSelectAddress,
  selectedAddress
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddressMode, setManualAddressMode] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

  // Debug logging for authentication state
  console.log("AddressSelector: Current user state:", currentUser);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser?.name || "",
      phone: "",
      houseNumber: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      label: "home",
      isDefault: false
    }
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // If there's a selected address, try to match it to an address in the list
  useEffect(() => {
    if (selectedAddress && !manualAddressMode) {
      // Try to find matching address
      if (addresses.length > 0) {
        const matchingAddr = addresses.find(addr => {
          const formattedAddr = formatFullAddress(addr);
          return formattedAddr === selectedAddress;
        });
        
        if (matchingAddr) {
          setSelectedAddressId(matchingAddr.id);
        } else {
          // If no matching saved address, might be a manual address
          setManualAddress(selectedAddress);
          setManualAddressMode(true);
        }
      } else {
        // No saved addresses, but we have a selected address
        setManualAddress(selectedAddress);
        setManualAddressMode(true);
      }
    }
  }, [selectedAddress, addresses]);

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      // Fetch addresses from local storage for demo
      const storedAddresses = localStorage.getItem(`addresses_${currentUser.id}`);
      console.log("Fetching addresses for user ID:", currentUser.id);
      console.log("Found stored addresses:", storedAddresses);
      
      if (storedAddresses) {
        const parsedAddresses = JSON.parse(storedAddresses);
        setAddresses(parsedAddresses);
        
        // If there's a default address and no selection yet, select it
        if (!selectedAddressId && !manualAddressMode) {
          const defaultAddress = parsedAddresses.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            const formattedAddr = formatFullAddress(defaultAddress);
            onSelectAddress(formattedAddr, defaultAddress);
          }
        }
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error",
        description: "Failed to load your saved addresses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    // Check if user is logged in
    if (!currentUser?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to save an address",
        variant: "destructive"
      });
      return;
    }
    
    form.reset({
      name: currentUser?.name || "",
      phone: "",
      houseNumber: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      label: "home",
      isDefault: addresses.length === 0
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to save an address",
        variant: "destructive"
      });
      return;
    }

    try {
      let updatedAddresses: Address[];
      
      // Add new address
      // If this is set as default or it's the first address, ensure others are not default
      if (values.isDefault || addresses.length === 0) {
        updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: false }));
      } else {
        updatedAddresses = [...addresses];
      }
      
      // Create new address with all required fields
      const newAddress: Address = {
        id: `addr_${Date.now()}`,
        userId: currentUser.id,
        name: values.name,
        phone: values.phone,
        houseNumber: values.houseNumber,
        street: values.street,
        landmark: values.landmark,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        label: values.label,
        isDefault: values.isDefault || addresses.length === 0 // First address is default
      };
      
      updatedAddresses.push(newAddress);
      
      // Save to local storage
      localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(updatedAddresses));
      
      // Update state
      setAddresses(updatedAddresses);

      // Select the new address
      setSelectedAddressId(newAddress.id);
      setManualAddressMode(false); // Exit manual mode if we were in it
      const formattedAddr = formatFullAddress(newAddress);
      onSelectAddress(formattedAddr, newAddress);
      
      toast({
        title: "Address saved",
        description: "Your new address has been added"
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive"
      });
    }
  };

  // Helper functions for address management
  const formatFullAddress = (address: Address) => {
    const parts = [
      address.houseNumber,
      address.street,
      address.landmark,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id);
    setManualAddressMode(false);
    const formattedAddress = formatFullAddress(address);
    onSelectAddress(formattedAddress, address);
  };
  
  const handleManualAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setManualAddress(value);
    onSelectAddress(value);
  };
  
  const toggleManualAddressMode = () => {
    setManualAddressMode(!manualAddressMode);
    if (!manualAddressMode) {
      // Switching to manual mode
      setSelectedAddressId(null);
      if (!manualAddress) {
        onSelectAddress("");
      }
    } else {
      // Switching away from manual mode
      if (addresses.length > 0) {
        // Select first address or default if available
        const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
        handleSelectAddress(defaultAddress);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-4 px-2 sm:px-4 md:px-0">
      {addresses.length === 0 && !manualAddressMode ? (
  <div className="text-center py-8 border rounded-md bg-gray-50 dark:bg-gray-900 mx-auto max-w-md">
          <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500 mb-4">You have no saved addresses.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              variant="default" 
              onClick={handleAddNew}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Address
            </Button>
            <Button 
              variant="outline"
              onClick={toggleManualAddressMode}
              className="w-full sm:w-auto"
            >
              Enter Address Manually
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Manual Address Entry Option */}
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Delivery Address</h3>
            <Button 
              variant="link" 
              onClick={toggleManualAddressMode} 
              className="text-sm p-0 h-auto"
            >
              {manualAddressMode ? "Use saved address" : "Enter address manually"}
            </Button>
          </div>
          
          {manualAddressMode ? (
            <div className="p-3 sm:p-4 border rounded-lg">
              <Label htmlFor="manual-address">Enter your complete address</Label>
              <Textarea 
                id="manual-address" 
                value={manualAddress} 
                onChange={handleManualAddressChange}
                placeholder="Enter your full address including name, house/flat number, street, city, state and pincode"
                className="mt-2 min-h-[100px]"
              />
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleAddNew} 
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Save this address
                </Button>
              </div>
            </div>
          ) : (
            <>
              <RadioGroup 
                value={selectedAddressId || ""} 
                className="space-y-3"
              >
                {addresses.map((address) => (
                  <div 
                    key={address.id} 
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer ${address.isDefault ? 'border-primary' : 'border-border'} ${selectedAddressId === address.id ? 'bg-primary/5' : ''}`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <RadioGroupItem value={address.id} id={`address-${address.id}`} />
                      <div className="flex-1">
                        {address.isDefault && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-md mb-2 inline-block">
                            Default
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.name}</span>
                          <span className="text-sm text-gray-500">
                            ({address.phone})
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{formatFullAddress(address)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleAddNew}
                  className="mt-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New Address
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="sm:max-w-[525px] w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Fill in the details to save a new delivery address
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name and Phone number row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter full name" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" type="tel" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Address Line 1 */}
              <FormField
                control={form.control}
                name="houseNumber"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel className="text-base">Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="House/Flat number, Building name" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Address Line 2 (Street and landmark) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Street</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street name" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="landmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Landmark, area" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* City and State row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City name" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State name" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Pincode and Label row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-digit pincode" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Address Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Set as default checkbox */}
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-normal">Set as default address</FormLabel>
                      <p className="text-sm text-muted-foreground">This will be your default delivery address</p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="sm:justify-end gap-4 mt-6">
                <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="w-full sm:w-[100px] h-11"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="w-full sm:w-[140px] h-11"
                  >
                    Save Address
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressSelector;
