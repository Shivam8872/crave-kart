
import { Link } from "react-router-dom";
import { Home, Store, List, User } from "lucide-react";

interface BottomNavProps {
  currentUser: any | null;
}

const BottomNav = ({ currentUser }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-[9999] backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 safe-bottom">
      <nav className="flex justify-around items-center h-16 px-4 max-w-screen-xl mx-auto">
        <Link
          to="/"
          className="flex flex-col items-center justify-center w-16 py-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>
        <Link
          to="/shops"
          className="flex flex-col items-center justify-center w-16 py-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Store className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Shops</span>
        </Link>
        <Link
          to="/orders"
          className="flex flex-col items-center justify-center w-16 py-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <List className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Orders</span>
        </Link>
        <Link
          to={currentUser ? "/profile" : "/login"}
          className="flex flex-col items-center justify-center w-16 py-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">
            {currentUser ? "Profile" : "Login"}
          </span>
        </Link>
      </nav>
    </div>
  );
};

export default BottomNav;
