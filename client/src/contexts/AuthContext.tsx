import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as auth from "../services/authService";
import * as shopService from "../services/shopService";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextProps {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, userType: string) => Promise<CurrentUser>;
  logout: () => void;
  registerShop: (shopData: Omit<Shop, "id" | "ownerId">) => Promise<string>;
  updateShop: (shopId: string, shopData: Partial<Shop>) => Promise<void>;
  deleteShop: (shopId: string) => Promise<void>;
  getUserOwnedShop: () => Shop | null;
  refreshUserShop: () => Promise<boolean>;
  isAdmin: () => boolean;
  approveShop: (shopId: string) => Promise<void>;
  denyShop: (shopId: string) => Promise<void>;
}

export interface CurrentUser {
  id: string;
  _id?: string;
  email: string;
  userType: "customer" | "shopOwner" | "admin";
  name: string;
  isEmailVerified: boolean;
  ownedShopId?: string;
  token?: string;
  createdAt?: Date;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  logo: string;
  categories: string[];
  ownerId: string;
  certificate?: {
    data: string;
    type: string;
    name: string;
  };
  status?: string;
  createdAt?: Date;
  _id?: string;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  setCurrentUser: () => {},
  isLoading: false,
  error: null,
  login: async () => {},
  signup: async () => ({ id: "", email: "", name: "", userType: "customer", isEmailVerified: false }),
  logout: () => {},
  registerShop: async () => "",
  updateShop: async () => {},
  deleteShop: async () => {},
  getUserOwnedShop: () => null,
  refreshUserShop: async () => false,
  isAdmin: () => false,
  approveShop: async () => {},
  denyShop: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  const [shopDataFetchStatus, setShopDataFetchStatus] = useState<'idle' | 'fetching' | 'fetched'>('idle');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const user = await auth.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (window.location.pathname === '/login') {
            if (user.userType === 'admin') {
              navigate('/admin');
            } else if (user.userType === 'shopOwner') {
              navigate(user.ownedShopId ? '/shop-dashboard' : '/register-shop');
            } else {
              navigate('/');
            }
          }
        } else {
          const protectedRoutes = ['/admin', '/shop-dashboard', '/profile'];
          if (protectedRoutes.some(route => window.location.pathname.startsWith(route))) {
            navigate('/login');
          }
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  useEffect(() => {
    const fetchUserShop = async () => {
      if (shopDataFetchStatus === 'fetching' || !currentUser) {
        return;
      }
      if (currentUser && currentUser.userType === "shopOwner" && currentUser.ownedShopId) {
        try {
          setShopDataFetchStatus('fetching');
          if (userShop && (userShop.id === currentUser.ownedShopId || userShop._id === currentUser.ownedShopId)) {
            setShopDataFetchStatus('fetched');
            return;
          }
          const shop = await shopService.getShopById(currentUser.ownedShopId, currentUser.id);
          if (shop) {
            setUserShop({
              ...shop,
              id: shop.id || shop._id
            });
          } else {
            setUserShop(null);
          }
        } catch {
          setUserShop(null);
        } finally {
          setShopDataFetchStatus('fetched');
        }
      } else {
        setUserShop(null);
        setShopDataFetchStatus('fetched');
      }
    };

    fetchUserShop();
  }, [currentUser, userShop, shopDataFetchStatus]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await auth.login({ email, password });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      setCurrentUser(user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || "user"}!`
      });

      if (user.userType === 'admin') {
        navigate("/admin");
      } else if (user.userType === 'shopOwner') {
        navigate(user.ownedShopId ? "/shop-dashboard" : "/register-shop");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      setError(error.message || "Failed to login");
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Failed to login"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, userType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await auth.register({ email, password, name, userType: userType as "customer" | "shopOwner" | "admin" });
      return user;
    } catch (error: any) {
      setError(error.message || "Failed to register");
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Failed to register"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch {}
    finally {
      setCurrentUser(null);
      setUserShop(null);
      setShopDataFetchStatus('idle');
      navigate("/login");
    }
  };

  const registerShop = async (shopData: Omit<Shop, "id" | "ownerId">) => {
    try {
      if (!currentUser) throw new Error("You must be logged in to register a shop");
      const userId = currentUser.id || currentUser._id;
      if (!userId) {
        throw new Error("User ID is missing. Please log in again.");
      }
      const shopDataWithOwner = {
        ...shopData,
        ownerId: userId,
        status: "pending"
      };
      const response = await shopService.registerShop(shopDataWithOwner);
      const shopId = response._id || response.id;
      setCurrentUser(prev => prev ? {
        ...prev,
        ownedShopId: shopId
      } : null);
      setUserShop({
        ...response,
        id: shopId
      });
      toast({
        title: "Shop Registered",
        description: "Your shop has been submitted for approval. You'll be notified once it's approved."
      });
      return shopId;
    } catch (error) {
      throw error;
    }
  };

  const updateShop = async (shopId: string, shopData: Partial<Shop>) => {
    try {
      if (!currentUser) throw new Error("You must be logged in to update a shop");
      await shopService.updateShop(shopId, shopData);
      if (userShop && userShop.id === shopId) {
        setUserShop({
          ...userShop,
          ...shopData
        });
      }
      toast({
        title: "Success",
        description: "Shop updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update shop"
      });
      throw error;
    }
  };

  const deleteShop = async (shopId: string) => {
    try {
      if (!currentUser) throw new Error("You must be logged in to delete a shop");
      await shopService.deleteShop(shopId, currentUser.id);
      setCurrentUser(prev => prev ? {
        ...prev,
        ownedShopId: undefined
      } : null);
      toast({
        title: "Success",
        description: "Shop deleted successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete shop"
      });
      throw error;
    }
  };

  const refreshUserShop = async () => {
    if (shopDataFetchStatus === 'fetching') {
      return false;
    }
    if (currentUser?.ownedShopId) {
      try {
        setShopDataFetchStatus('fetching');
        const shopData = await shopService.getShopById(currentUser.ownedShopId, currentUser.id);
        if (shopData) {
          setUserShop({
            ...shopData,
            id: shopData.id || shopData._id
          });
          setShopDataFetchStatus('fetched');
          return true;
        }
      } catch {
      } finally {
        setShopDataFetchStatus('fetched');
      }
    }
    return false;
  };

  const getUserOwnedShop = () => {
    return userShop;
  };

  const isAdmin = () => {
    return currentUser?.userType === 'admin';
  };

  const approveShop = async (shopId: string) => {
    try {
      if (!currentUser || currentUser.userType !== 'admin') {
        throw new Error("Only admins can approve shops");
      }
      await shopService.updateShop(shopId, { status: "approved" }, currentUser.userType);
      await refreshUserShop();
      toast({
        title: "Shop Approved",
        description: "The shop has been approved and is now visible to customers"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve shop"
      });
      throw error;
    }
  };

  const denyShop = async (shopId: string) => {
    try {
      if (!currentUser || currentUser.userType !== 'admin') {
        throw new Error("Only admins can deny shops");
      }
      await shopService.updateShop(shopId, { status: "rejected" }, currentUser.userType);
      toast({
        title: "Shop Denied",
        description: "The shop has been rejected"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to deny shop"
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    isLoading,
    error,
    login,
    signup,
    logout,
    registerShop,
    updateShop,
    deleteShop,
    getUserOwnedShop,
    refreshUserShop,
    isAdmin,
    approveShop,
    denyShop
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
