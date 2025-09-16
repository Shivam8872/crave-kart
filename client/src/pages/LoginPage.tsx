
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkIssue, setNetworkIssue] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    setNetworkIssue(false);
    
    try {
      await login(values.email, values.password);
      
      // Get current user after login
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      
      // Show success message
      toast.success("Login successful!");
      
      // Redirect based on user type
      if (currentUser) {
        if (currentUser.userType === "admin") {
          navigate("/admin");
        } else if (currentUser.userType === "shopOwner") {
          if (currentUser.ownedShopId) {
            navigate("/shop-dashboard");
          } else {
            navigate("/register-shop");
          }
        } else {
          // For customers, redirect to the page they were trying to access, or to the home page
          const params = new URLSearchParams(location.search);
          const redirectTo = params.get("redirect");
          
          if (redirectTo === "cart") {
            navigate("/cart");
          } else {
            navigate("/");
          }
        }
      }
    } catch (error: any) {
      if (error.message?.includes("Network") || error.code === "ERR_NETWORK") {
        setNetworkIssue(true);
        setError("Network connection issue. Trying fallback login method...");
        
        // We'll let the fallback logic in authService.ts handle this
        // The message will be shown temporarily until either success or another error
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {networkIssue && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
              <p>Server connection issues detected. You can try:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Using demo login: customer@example.com / password123</li>
                <li>For shop owner demo: owner@example.com / password123</li>
                <li>For admin demo: admin@example.com / password123</li>
              </ul>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <Link to="/signup" className="text-black dark:text-white font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default LoginPage;
