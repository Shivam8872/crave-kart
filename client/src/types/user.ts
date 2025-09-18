export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'customer' | 'shopOwner' | 'admin';
  isEmailVerified: boolean;
  ownedShopId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CurrentUser = User;

export interface UserProfile extends User {
  addresses?: Address[];
  preferences?: UserPreferences;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}