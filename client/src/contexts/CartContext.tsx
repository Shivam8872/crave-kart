import React, { createContext, useContext, useState, useEffect } from "react";
import { FoodItem } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";

interface CartItem extends FoodItem {
  quantity: number;
  id: string; // ensure `id` is present for consistent logic
}

interface CartContextType {
  cartItems: CartItem[];
  currentShop: string | null;
  addToCart: (item: FoodItem, shopId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentShop, setCurrentShop] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedShop = localStorage.getItem("currentShop");
    if (storedCart) setCartItems(JSON.parse(storedCart));
    if (storedShop) setCurrentShop(storedShop);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (currentShop) {
      localStorage.setItem("currentShop", currentShop);
    } else {
      localStorage.removeItem("currentShop");
    }
  }, [currentShop]);

  const addToCart = (item: FoodItem, shopId: string) => {
    const normalizedItem = {
      ...item,
      id: (item as any)._id || (item as any).id, // ✅ fix: normalize _id to id
    };

    if (cartItems.length === 0) {
      setCurrentShop(shopId);
    }

    if (currentShop && currentShop !== shopId) {
      toast({
        variant: "destructive",
        title: "Different Shop",
        description:
          "You already have items from a different shop. Clear your cart first to add from this shop.",
      });
      return;
    }

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (cartItem) => cartItem.id === normalizedItem.id
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        return [...prevItems, { ...normalizedItem, quantity: 1 }];
      }
    });

    toast({
      description: `Added ${item.name} to your cart.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== itemId);
      if (updatedItems.length === 0) setCurrentShop(null);
      return updatedItems;
    });

    toast({
      description: "Item removed from cart.",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCurrentShop(null);

    toast({
      description: "Cart cleared successfully.",
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const value = {
    cartItems,
    currentShop,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    totalItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
