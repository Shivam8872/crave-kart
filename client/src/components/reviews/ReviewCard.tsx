
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import * as reviewService from "@/services/reviewService";
import { useToast } from "@/hooks/use-toast";

interface ReviewCardProps {
  id: string;
  shopId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string | Date;
  shopResponse?: {
    response: string;
    createdAt: string | Date;
  };
  onResponseAdded?: (reviewId: string, response: string) => void;
  isShopOwner?: boolean;
}

const ReviewCard = ({
  id,
  shopId,
  userName,
  rating,
  comment,
  createdAt,
  shopResponse,
  onResponseAdded,
  isShopOwner = false,
}: ReviewCardProps) => {
  const { currentUser } = useAuth();
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddResponse = async () => {
    if (!responseText.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response to submit",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.addReviewResponse(id, responseText);
      toast({
        title: "Response added",
        description: "Your response has been added to the review",
      });
      if (onResponseAdded) {
        onResponseAdded(id, responseText);
      }
      setIsResponding(false);
      setResponseText("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add response",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate initials from username
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format the date 
  const formatDate = (date: string | Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Date unknown";
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{userName}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        className={index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    {formatDate(createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm mt-2">{comment}</p>

            {/* Shop Response Section */}
            {shopResponse && (
              <div className="mt-4 pl-4 border-l-2 border-gray-200">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} />
                    <span className="text-sm font-medium">Shop Response</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(shopResponse.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{shopResponse.response}</p>
                </div>
              </div>
            )}

            {/* Response Form for Shop Owner */}
            {isShopOwner && !shopResponse && (
              <div className="mt-4">
                {isResponding ? (
                  <div className="space-y-2">
                    <Textarea
                      className="w-full"
                      placeholder="Write your response here..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsResponding(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddResponse}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Response"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setIsResponding(true)}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Respond to Review
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
