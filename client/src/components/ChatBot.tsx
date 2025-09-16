import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, MessageCircle, Key, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const initialBotMessages = [
  "👋 Hi there! I'm your Crave-Kart AI assistant. How can I help you today?",
  "You can ask me about restaurants, menu items, delivery, or how to use the app!",
];

// Get API key from environment variables or use the provided one
// In production, this will come from the server environment
const DEFAULT_API_KEY = import.meta.env.VITE_OPENAI_API_KEY ||"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"

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { content: initialBotMessages[0], isUser: false, timestamp: new Date() },
    { content: initialBotMessages[1], isUser: false, timestamp: new Date() },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyValidated, setApiKeyValidated] = useState(true); // Set to true by default
  const [showApiKey, setShowApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const apiInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      if (apiKeyValidated && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      } else if (showApiKeyInput && apiInputRef.current) {
        setTimeout(() => {
          apiInputRef.current?.focus();
        }, 300);
      }
    }
  }, [isOpen, apiKeyValidated, showApiKeyInput]);

  // Store the default API key in localStorage on first load
  useEffect(() => {
    // Store the API key in localStorage if not already there
    if (!localStorage.getItem("openai_api_key")) {
      localStorage.setItem("openai_api_key", DEFAULT_API_KEY);
    }
  }, []);

  const validateStoredApiKey = async (keyToValidate: string) => {
    try {
      setIsLoading(true);
      // Make a minimal API call to validate the key
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${keyToValidate}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      // Key is valid
      setApiKeyValidated(true);
      setShowApiKeyInput(false);
      
      // We no longer add a validation message here
    } catch (error) {
      console.error("API Key validation failed:", error);
      // Show the API key input since validation failed
      setShowApiKeyInput(true);
      
      const systemMessage: Message = {
        content: "I couldn't validate the API key. Please provide a valid OpenAI API key.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const handleChangeApiKey = () => {
    setShowApiKeyInput(true);
    setApiKeyValidated(false);
  };

  const validateApiKey = async () => {
    if (!apiKey.trim() || apiKey.trim() === "api-key") {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid OpenAI API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Make a minimal API call to validate the key
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      // Key is valid
      localStorage.setItem("openai_api_key", apiKey);
      setApiKeyValidated(true);
      setShowApiKeyInput(false);
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been validated and saved.",
      });
      
      // We no longer add a validation message here
      
    } catch (error) {
      console.error("API Key validation failed:", error);
      toast({
        title: "API Key Invalid",
        description: "Could not validate your OpenAI API key. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // If API key isn't provided or validated, fall back to pattern matching
      if (!apiKeyValidated) {
        setTimeout(() => {
          const botResponse = generateFallbackBotResponse(inputMessage);
          const botMessage: Message = {
            content: botResponse,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setIsLoading(false);
        }, 600);
        return;
      }

      // Get the current API key (either the one in state or from localStorage)
      const currentApiKey = apiKey || localStorage.getItem("openai_api_key") || DEFAULT_API_KEY;

      // Create context from previous messages for better continuity
      const messageHistory = messages.slice(-6).map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }));

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for a food delivery app called Crave-Kart. Provide concise, helpful responses about restaurants, food, delivery, the ordering process, and using the app. Keep responses under 150 words and focus on being practical and informative. If asked about topics unrelated to food delivery or the app, politely redirect the conversation back to DineHub services."
            },
            ...messageHistory,
            {
              role: "user",
              content: inputMessage
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Add AI response
      const botMessage: Message = {
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      
      // Fallback to pattern matching if API fails
      const fallbackResponse = generateFallbackBotResponse(inputMessage);
      const fallbackMessage: Message = {
        content: `${fallbackResponse}\n\n(Note: I'm currently using fallback responses due to an API issue. Please check your API key if this persists.)`,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, fallbackMessage]);
      
      toast({
        title: "AI Service Error",
        description: "There was an issue connecting to the AI service. Using fallback responses instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showApiKeyInput) {
        validateApiKey();
      } else {
        handleSendMessage();
      }
    }
  };

  // Fallback response generator - our original pattern matching function
  const generateFallbackBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Greetings
    if (input.includes("hello") || input.includes("hi") || input.includes("hey") || input.includes("howdy")) {
      return "Hello there! How can I assist you with your food order today?";
    }
    
    // Menu and food related questions
    else if (input.includes("menu") || input.includes("food") || input.includes("dish") || input.includes("eat")) {
      return "You can browse our menu by clicking on 'Shops' in the navigation bar. We offer various cuisines including burgers, pizza, Chinese food, and more. Each restaurant has its own menu categorized for easy browsing!";
    }
    
    // Order related questions
    else if (input.includes("order") || input.includes("checkout") || input.includes("cart")) {
      return "To place an order, add items to your cart by clicking 'Add to Cart' on any food item. When you're ready, click on the cart icon in the top-right corner to review your order and proceed to checkout.";
    }
    
    // Payment related questions
    else if (input.includes("payment") || input.includes("pay") || input.includes("cash") || input.includes("card") || input.includes("credit")) {
      return "We accept multiple payment methods including credit/debit cards, digital wallets (Google Pay, Apple Pay), and cash on delivery. All online payments are processed securely through our payment gateway.";
    }
    
    // Delivery related questions
    else if (input.includes("delivery") || input.includes("time") || input.includes("arrive") || input.includes("late")) {
      return "Delivery typically takes 30-45 minutes depending on your location and the restaurant's busy hours. Once your order is confirmed, you'll receive an estimated delivery time. You can track your order status in the 'Orders' section after logging in.";
    }
    
    // Refund and cancellation related questions
    else if (input.includes("refund") || input.includes("cancel") || input.includes("wrong") || input.includes("mistake")) {
      return "You can cancel your order within 5 minutes of placing it by going to 'Orders' and selecting 'Cancel Order'. For refunds or issues with delivered orders, please contact our customer support at support@cravekart.com or through the 'Help' section in your profile.";
    }
    
    // Contact and support related questions
    else if (input.includes("contact") || input.includes("support") || input.includes("help") || input.includes("service")) {
      return "You can reach our customer support at support@cravekart.com or call us at +91 6207237277. Our support team is available 24/7 to assist you with any issues or questions.";
    }
    
    // Account related questions
    else if (input.includes("account") || input.includes("profile") || input.includes("sign") || input.includes("login") || input.includes("register")) {
      return "You can create an account by clicking 'Sign Up' in the top-right corner. If you already have an account, click 'Login'. Your profile section allows you to manage your details, view order history, and save favorite restaurants.";
    }
    
    // Discount and offers related questions
    else if (input.includes("discount") || input.includes("offer") || input.includes("coupon") || input.includes("promo") || input.includes("code")) {
      return "We regularly offer discounts and promotions! Check the homepage banner for current offers. You can also subscribe to our newsletter for exclusive deals. During checkout, you can apply any valid coupon code in the designated field.";
    }
    
    // Restaurant related questions
    else if (input.includes("restaurant") || input.includes("shop") || input.includes("vendor") || input.includes("store")) {
      return "CraveKart partners with a variety of restaurants and food outlets. You can find all available restaurants by clicking 'Shops' in the navigation bar. Each shop has ratings, reviews, and detailed information about their cuisine and delivery areas.";
    }
    
    // Dietary preferences and allergies
    else if (input.includes("vegetarian") || input.includes("vegan") || input.includes("gluten") || input.includes("allergy") || input.includes("diet")) {
      return "Many of our restaurant partners offer vegetarian, vegan, and gluten-free options. You can find dietary information on each food item's description. If you have specific allergies, please mention them in the 'Special Instructions' section during checkout.";
    }
    
    // Feedback and reviews
    else if (input.includes("feedback") || input.includes("review") || input.includes("rate") || input.includes("comment")) {
      return "We value your feedback! After receiving your order, you can rate and review both the food items and the delivery service. Your honest reviews help us improve and assist other customers in making choices.";
    }
    
    // App usage and features
    else if (input.includes("app") || input.includes("website") || input.includes("use") || input.includes("feature") || input.includes("how to")) {
      return "CraveKart makes food ordering simple! Browse restaurants, select food items, add them to cart, and checkout. You can track orders, save favorite restaurants, and reorder past meals with just a few clicks. Need specific guidance? Feel free to ask!";
    }
    
    // Location and service area
    else if (input.includes("location") || input.includes("area") || input.includes("where") || input.includes("city") || input.includes("address")) {
      return "CraveKart currently serves major metropolitan areas. During checkout, you'll enter your delivery address, and we'll show you restaurants that deliver to your location. Some restaurants may have delivery radius limitations.";
    }
    
    // Appreciation responses
    else if (input.includes("thank") || input.includes("thanks") || input.includes("good") || input.includes("great") || input.includes("awesome")) {
      return "You're welcome! I'm happy to help. Is there anything else you'd like to know about our services?";
    }
    
    // Default response for unrecognized queries
    else {
      return "Thanks for your question. I'm not quite sure about that specific topic, but I'd be happy to help with information about our restaurants, menu items, ordering process, delivery, or account management. Could you please clarify what you'd like to know?";
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={toggleChat}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-black text-white hover:bg-gray-800"
          aria-label="Open chat"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden border"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Chat Header */}
            <div className="bg-black text-white p-4 flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              <div className="flex-1">
                <h3 className="font-medium">CraveKart AI Assistant</h3>
                <p className="text-xs text-gray-300">
                  {apiKeyValidated ? "AI Powered | Ask me anything" : "Setup Required"}
                </p>
              </div>
              {apiKeyValidated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeApiKey}
                  className="mr-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <Key className="h-3 w-3 mr-1" />
                  Change Key
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* API Key Input */}
            {showApiKeyInput && (
              <div className="p-4 border-b">
                <div className="mb-2">
                  <p className="text-sm font-medium mb-1">Enter your OpenAI API Key to activate the AI assistant:</p>
                  <p className="text-xs text-gray-500 mb-2">
                    You can get an API key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      OpenAI's platform
                    </a>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={apiInputRef}
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="sk-..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={toggleShowApiKey}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={validateApiKey}
                    disabled={isLoading || !apiKey.trim()}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    {isLoading ? "Validating..." : "Save"}
                  </Button>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Your API key is stored in your browser only and never sent to our servers.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs hover:bg-gray-100"
                    onClick={() => {
                      setShowApiKeyInput(false);
                      // Add a message explaining the use of fallback mode
                      setMessages(prev => [
                        ...prev, 
                        { 
                          content: "I'll be using pre-programmed responses since no API key is provided. For more advanced AI capabilities, please add your OpenAI API key.", 
                          isUser: false, 
                          timestamp: new Date() 
                        }
                      ]);
                    }}
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs mt-1 block opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-[80%] rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            {!showApiKeyInput && (
              <div className="p-3 border-t">
                <div className="flex">
                  <Textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={apiKeyValidated ? "Type your message..." : "Type your message (using pre-programmed responses)..."}
                    className="flex-1 resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="ml-2 bg-black hover:bg-gray-800 text-white"
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!apiKeyValidated && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setShowApiKeyInput(true)}
                    >
                      <Key className="h-3 w-3 mr-2" />
                      Add OpenAI API Key for Full AI Features
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
