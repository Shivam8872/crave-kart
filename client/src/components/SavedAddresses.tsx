
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Plus, Edit, Trash, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as addressService from "@/services/addressService";

interface SavedAddress {
  id?: string;
  userId: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface SavedAddressesProps {
  onSelectAddress?: (address: string) => void;
  showActions?: boolean;
}

const SavedAddresses = ({ onSelectAddress, showActions = true }: SavedAddressesProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formData, setFormData] = useState<Omit<SavedAddress, 'id' | 'userId'>>({
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchAddresses();
    }
  }, [currentUser]);

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const savedAddresses = await addressService.getSavedAddresses(currentUser.id);
      setAddresses(savedAddresses);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: addresses.length === 0 // Set as default if it's the first address
    });
    setDialogOpen(true);
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setFormData({
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isDefault: address.isDefault
    });
    setDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!currentUser?.id || !addressId) return;
    
    try {
      await addressService.deleteAddress(currentUser.id, addressId);
      toast({
        title: "Address deleted",
        description: "Your address has been removed"
      });
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    try {
      if (editingAddress) {
        // Update existing address
        await addressService.updateAddress({
          ...formData,
          id: editingAddress.id,
          userId: currentUser.id
        });
        toast({
          title: "Address updated",
          description: "Your address has been updated successfully"
        });
      } else {
        // Add new address
        await addressService.saveAddress({
          ...formData,
          userId: currentUser.id
        });
        toast({
          title: "Address saved",
          description: "Your new address has been added"
        });
      }
      setDialogOpen(false);
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive"
      });
    }
  };

  const handleSelect = (address: SavedAddress) => {
    if (onSelectAddress) {
      const fullAddress = `${address.addressLine}, ${address.city}, ${address.state} ${address.postalCode}`;
      onSelectAddress(fullAddress);
    }
  };

  const formatAddress = (address: SavedAddress) => {
    return `${address.addressLine}, ${address.city}, ${address.state} ${address.postalCode}`;
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
          <Home className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">No addresses saved</p>
          {showActions && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4" 
              onClick={handleAddNew}
            >
              Add your first address
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className={`p-3 ${address.isDefault ? 'border-primary' : ''}`}>
              <div className="flex justify-between">
                <div className="flex-1">
                  {address.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-md mb-2 inline-block">
                      Default
                    </span>
                  )}
                  <p className="font-medium">{formatAddress(address)}</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  {showActions ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(address.id || '')}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSelect(address)}
                    >
                      <MapPin className="h-4 w-4 mr-1" /> Select
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine">Address Line</Label>
              <Input
                id="addressLine"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleInputChange}
                placeholder="Street address, apartment, etc."
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="Postal Code"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isDefault">Set as default address</Label>
            </div>
            
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedAddresses;
