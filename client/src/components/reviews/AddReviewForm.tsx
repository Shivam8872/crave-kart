
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import * as reviewService from "@/services/reviewService";

// Define the Review interface
export interface Review {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  shopResponse?: {
    response: string;
    createdAt: string;
  };
}

interface AddReviewFormProps {
  shopId: string;
  onReviewAdded: (newReview: Review) => void;
}

const AddReviewForm = ({ shopId, onReviewAdded }: AddReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Review required",
        description: "Please enter a review comment",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        shopId,
        rating,
        comment
      };

      const response = await reviewService.addReview(reviewData);
      
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!"
      });
      
      // Reset form
      setRating(0);
      setComment("");
      
      // Call the callback with the new review
      onReviewAdded(response);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border shadow-sm">
      <h3 className="text-lg font-medium mb-3">Write a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="mr-3 text-sm font-medium">Your Rating:</label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  className={`cursor-pointer transition-colors ${
                    (hoveredRating || rating) >= star
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Share your experience with this shop..."
            className="min-h-[100px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
};

export default AddReviewForm;
