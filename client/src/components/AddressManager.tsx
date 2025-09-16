
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { MapPin, Plus, Home, Briefcase, Heart, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  label: "home" | "work" | "other";
  isDefault: boolean;
}

interface AddressManagerProps {
  onSelectAddress?: (address: string) => void;
  showActions?: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number should be at least 10 digits"),
  houseNumber: z.string().min(1, "House/Flat number is required"),
  street: z.string().min(1, "Street is required"),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(4, "Valid pincode is required"),
  label: z.enum(["home", "work", "other"]),
  isDefault: z.boolean().default(false)
});

const AddressManager: React.FC<AddressManagerProps> = ({ 
  onSelectAddress, 
  showActions = true 
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
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
    }
  }, [currentUser]);

  useEffect(() => {
    if (editingAddress) {
      form.reset({
        name: editingAddress.name,
        phone: editingAddress.phone,
        houseNumber: editingAddress.houseNumber,
        street: editingAddress.street,
        landmark: editingAddress.landmark || "",
        city: editingAddress.city,
        state: editingAddress.state,
        pincode: editingAddress.pincode,
        label: editingAddress.label,
        isDefault: editingAddress.isDefault
      });
    } else {
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
        isDefault: addresses.length === 0 // Set as default if it's the first address
      });
    }
  }, [editingAddress, currentUser, addresses.length, form]);

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      // Fetch addresses from local storage for demo
      const storedAddresses = localStorage.getItem(`addresses_${currentUser.id}`);
      if (storedAddresses) {
        setAddresses(JSON.parse(storedAddresses));
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
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!currentUser?.id) return;
    
    try {
      // Filter out the address to delete
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // Update local storage
      localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(updatedAddresses));
      
      // Update state
      setAddresses(updatedAddresses);
      
      toast({
        title: "Address deleted",
        description: "Your address has been removed"
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser?.id) return;

    try {
      let updatedAddresses: Address[];
      
      if (editingAddress) {
        // Update existing address
        updatedAddresses = addresses.map(addr => 
          addr.id === editingAddress.id 
            ? { 
                ...addr, 
                ...values, 
                // If this is set as default, ensure others are not default
                isDefault: values.isDefault 
              } 
            : values.isDefault ? { ...addr, isDefault: false } : addr
        );
        
        toast({
          title: "Address updated",
          description: "Your address has been updated successfully"
        });
      } else {
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
        
        toast({
          title: "Address saved",
          description: "Your new address has been added"
        });
      }
      
      // Save to local storage
      localStorage.setItem(`addresses_${currentUser.id}`, JSON.stringify(updatedAddresses));
      
      // Update state
      setAddresses(updatedAddresses);
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

  const handleSelect = (address: Address) => {
    if (onSelectAddress) {
      const formattedAddress = formatFullAddress(address);
      onSelectAddress(formattedAddress);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "home": return <Home className="h-4 w-4" />;
      case "work": return <Briefcase className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Available",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }
    
    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use a geocoding service to get address details
          // For this demo, we'll just show the coordinates and set some placeholder data
          form.setValue('street', `Near ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          form.setValue('city', 'Detected City');
          form.setValue('state', 'Detected State');
          
          toast({
            title: "Location detected",
            description: "Please complete the remaining address fields"
          });
        } catch (error) {
          console.error("Error detecting location:", error);
          toast({
            title: "Error",
            description: "Failed to detect your location",
            variant: "destructive"
          });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location error",
          description: 
            error.code === 1 
              ? "Location permission denied. Please enter your address manually." 
              : "Failed to detect your location. Please try again or enter manually.",
          variant: "destructive"
        });
        setGettingLocation(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Your Addresses</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Your Addresses</h3>
        {showActions && (
          <Button variant="outline" size="sm" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50 dark:bg-gray-900">
          <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">No addresses saved</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4" 
            onClick={handleAddNew}
          >
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className={`p-3 border rounded-lg ${address.isDefault ? 'border-primary' : 'border-border'}`}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  {address.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-md mb-2 inline-block">
                      Default
                    </span>
                  )}
                  <div className="flex items-center mb-1">
                    <span className="font-medium mr-2">{address.name}</span>
                    <span className="text-sm text-gray-500">
                      ({address.label.charAt(0).toUpperCase() + address.label.slice(1)})
                    </span>
                  </div>
                  <div className="flex items-center mb-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{address.phone}</span>
                  </div>
                  <p className="text-sm text-gray-700">{formatFullAddress(address)}</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  {showActions ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(address)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSelect(address)}
                    >
                      <MapPin className="h-4 w-4 mr-1" /> Deliver Here
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              Enter your delivery address details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name and Phone number row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter full name" />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" type="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Detect location button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={gettingLocation}
                onClick={detectLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {gettingLocation ? "Detecting location..." : "Use my current location"}
              </Button>
              
              {/* House/Flat number and Street row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="houseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House/Flat Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g. Flat 101, Block A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Landmark */}
              <FormField
                control={form.control}
                name="landmark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Landmark (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="E.g. Near park, Opposite hospital" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* City and State row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City name" />
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
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Pincode and Label row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-digit pincode" />
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
                      <FormLabel>Address Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as default address</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressManager;
