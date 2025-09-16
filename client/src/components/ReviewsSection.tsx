
import { useState, useEffect } from "react";
import { Star, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ReviewCard from "./reviews/ReviewCard";
import AddReviewForm from "./reviews/AddReviewForm";
import * as reviewService from "@/services/reviewService";
import { Review } from "@/services/reviewService";

interface ReviewsSectionProps {
  shopId: string;
}

const ReviewsSection = ({ shopId }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<string>("newest");
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  
  // Check if the current user is the shop owner
  const [isShopOwner, setIsShopOwner] = useState(false);
  // Check if the user has already submitted a review
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    
    fetchReviews();
    
    // Check if current user is the shop owner
    if (currentUser) {
      setIsShopOwner(currentUser.ownedShopId === shopId);
      
      // Check if user has already submitted a review
      if (reviews.length > 0 && currentUser.id) {
        const userReview = reviews.find(review => review.userId === currentUser.id);
        setHasSubmittedReview(!!userReview);
      }
    }
  }, [shopId, currentUser]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await reviewService.getShopReviews(shopId);
      setReviews(data);
      
      // Check if user has already submitted a review after fetching
      if (currentUser && currentUser.id && data.length > 0) {
        const userReview = data.find(review => review.userId === currentUser.id);
        setHasSubmittedReview(!!userReview);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        variant: "destructive",
        title: "Failed to load reviews",
        description: "Could not retrieve reviews. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseAdded = (reviewId: string, responseText: string) => {
    // Update the reviews state with the new response
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? {
              ...review, 
              shopResponse: { 
                response: responseText, 
                createdAt: new Date().toISOString()
              }
            } 
          : review
      )
    );
  };

  const handleReviewAdded = (newReview: Review) => {
    // Add the new review to the list
    setReviews(prevReviews => [newReview, ...prevReviews]);
    setShowAddReviewForm(false);
    setHasSubmittedReview(true);
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Count reviews by rating (for the rating breakdown)
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => {
    return {
      rating,
      count: reviews.filter(review => review.rating === rating).length,
      percentage: reviews.length > 0 
        ? Math.round((reviews.filter(review => review.rating === rating).length / reviews.length) * 100) 
        : 0
    };
  });

  // Sort and filter the reviews
  const sortedAndFilteredReviews = [...reviews]
    .filter(review => {
      if (filter === "all") return true;
      return review.rating === parseInt(filter);
    })
    .sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sort === "highest") {
        return b.rating - a.rating;
      } else {
        return a.rating - b.rating;
      }
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex space-x-4">
          <Skeleton className="h-36 w-1/3" />
          <div className="w-2/3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Customer Reviews</h2>
      
      {/* Reviews summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        {/* Left side: Average rating */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-bold">{averageRating}</div>
          <div className="flex items-center mt-2">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                size={20}
                className={(index < Math.round(Number(averageRating))) 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-gray-300"
                }
              />
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </div>
        </div>
        
        {/* Right side: Rating breakdown */}
        <div className="space-y-2">
          {ratingCounts.map((item) => (
            <div key={item.rating} className="flex items-center">
              <div className="w-8 text-sm">{item.rating} ★</div>
              <div className="flex-1 mx-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-2 bg-yellow-400" 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-8 text-sm text-gray-500">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add review section */}
      {currentUser && !isShopOwner && !hasSubmittedReview && (
        <div className="mt-6">
          {showAddReviewForm ? (
            <AddReviewForm 
              shopId={shopId} 
              onReviewAdded={handleReviewAdded} 
            />
          ) : (
            <Button 
              onClick={() => setShowAddReviewForm(true)}
              className="mb-4"
            >
              Write a Review
            </Button>
          )}
        </div>
      )}
      
      {/* Sorting and filtering controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center">
          <SlidersHorizontal size={16} className="mr-2 text-gray-500" />
          <span className="mr-2 text-sm">Filter by:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <span className="mr-2 text-sm">Sort by:</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Reviews list */}
      <div className="space-y-4 mt-4">
        {sortedAndFilteredReviews.length > 0 ? (
          sortedAndFilteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              id={review.id}
              shopId={review.shopId}
              userName={review.userName}
              rating={review.rating}
              comment={review.comment}
              createdAt={review.createdAt}
              shopResponse={review.shopResponse}
              isShopOwner={isShopOwner}
              onResponseAdded={handleResponseAdded}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {filter !== "all" 
              ? `No ${filter}-star reviews yet.`
              : "No reviews yet. Be the first to leave a review!"}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;
