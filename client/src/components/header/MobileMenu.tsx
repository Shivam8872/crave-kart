import { Link } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";

interface MobileMenuProps {
  currentUser: any | null;
  totalItems: number;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  currentUser,
  totalItems,
  onClose,
}) => {
  return (
    <div className="flex items-center space-x-4 md:hidden">
      <Link
        to="/cart"
        className="relative flex items-center text-gray-700 dark:text-gray-200"
        onClick={onClose}
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
          onClick={onClose}
        >
          Sign In
        </Link>
      ) : (
        <Link
          to="/profile"
          className="flex items-center text-gray-700 dark:text-gray-200"
          onClick={onClose}
        >
          <User className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
};


export default MobileMenu;
