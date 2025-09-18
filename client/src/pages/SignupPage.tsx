import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EmailVerification } from "@/components/EmailVerification";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  userType: z.enum(["customer", "shopOwner"], { 
    required_error: "Please select a user type" 
  }),
});

const SignupPage = () => {
  const { signup, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkIssue, setNetworkIssue] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      userType: "customer",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Step 1: Do NOT register yet. Trigger pre-registration OTP flow.
    setIsLoading(true);
    setError(null);
    setNetworkIssue(false);

    try {
      // Store values to use after OTP verification
      setPendingValues(values);
      setRegisteredEmail(values.email);
      setShowEmailVerification(true); // This will render EmailVerification which auto-sends OTP
      toast.success("Verification code sent! Please check your email.");
    } catch (error: any) {
      setError(error.message || "Failed to initiate verification.");
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
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Sign up to start ordering food or registering your shop
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
              <p>Server connection issues detected. Creating a demo account instead.</p>
              <p className="mt-1">Note: Demo accounts are for testing purposes only and will not persist across sessions.</p>
            </div>
          )}

          {!showEmailVerification ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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

                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Account Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="customer" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Customer - Order food from restaurants
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="shopOwner" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Restaurant Owner - Register your restaurant
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
                  variant="indian"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="mt-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold">Verify Your Email</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Please verify your email address to complete registration
                </p>
              </div>
              <EmailVerification
                email={registeredEmail}
                mode="pre"
                onVerificationComplete={async (payload) => {
                  if (!pendingValues) return;
                  const { emailVerifiedToken } = payload || {};
                  if (!emailVerifiedToken) {
                    toast.error("Verification token missing. Please try again.");
                    return;
                  }

                  try {
                    // Step 2: Register account after OTP verification
                    const newUser = await (await import("@/services/authService")).register({
                      email: pendingValues.email,
                      password: pendingValues.password,
                      name: pendingValues.name,
                      userType: pendingValues.userType,
                      emailVerifiedToken
                    });

                    // Step 3: Persist session and redirect
                    if (newUser.token) {
                      localStorage.setItem('authToken', newUser.token);
                    }
                    localStorage.setItem('currentUser', JSON.stringify(newUser));
                    setCurrentUser(newUser as any);

                    toast.success("Account created and verified! You're now logged in.");

                    // Navigate based on role
                    const role = newUser.userType;
                    if (role === 'admin') {
                      navigate('/admin');
                    } else if (role === 'shopOwner') {
                      navigate('/register-shop');
                    } else {
                      navigate('/');
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Registration failed after verification');
                  }
                }}
              />
            </div>
          )}

          {!showEmailVerification && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-600 dark:text-orange-500 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default SignupPage;