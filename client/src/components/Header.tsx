import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import NavLinks from "./header/NavLinks";
import CartButton from "./header/CartButton";
import UserMenu from "./header/UserMenu";

const Header = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? theme === "dark"
            ? "bg-gray-900/80 backdrop-blur-md shadow-sm"
            : "bg-white/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-semibold tracking-wide text-gray-900 dark:text-white">
            <span className="text-red-600 dark:text-red-400">Crave</span>Kart
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavLinks isAdmin={isAdmin()} />

        {/* Desktop Cart and User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <CartButton totalItems={totalItems} />
          <UserMenu
            currentUser={currentUser}
            isAdmin={isAdmin()}
            onLogout={logout}
          />
        </div>

        {/* Mobile Cart and Sign In/Profile */}
        <div className="flex md:hidden items-center space-x-4">
          <Link
            to="/cart"
            className="relative flex items-center text-gray-700 dark:text-gray-200"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                {totalItems}
              </span>
            )}
          </Link>

          {!currentUser ? (
            <Link
              to="/login"
              className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
            >
              Sign In
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center text-gray-700 dark:text-gray-200"
            >
              <User className="h-6 w-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
