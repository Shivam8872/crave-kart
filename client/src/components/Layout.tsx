
import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatBot from "./ChatBot";
import ThemeToggle from "./ThemeToggle";
import BottomNav from "./header/BottomNav";
import { useAuth } from "@/contexts/AuthContext";


interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { currentUser } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-24 md:pb-0">{children}</main>
      <Footer className="hidden md:block" />
      <div className="fixed bottom-20 left-6 z-50 md:bottom-6">
        <ThemeToggle />
      </div>
      <ChatBot />
      <BottomNav currentUser={currentUser} />
    </div>
  );
};

export default Layout;
