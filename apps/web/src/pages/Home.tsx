import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PostCard, { type Post } from "@/components/post/PostCard";

const DUMMY_POSTS: Post[] = [
  {
    id: "welcome",
    authorDisplayName: "BookTalk",
    authorUsername: "booktalk",
    content:
      "Hi, welcome to BookTalk! This is where book lovers share thoughts, reviews, and recommendations. Start by following people and posting about what you're reading.",
    hasSpoilers: false,
    createdAt: new Date().toISOString(),
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <h2 className="text-2xl font-semibold mb-2" style={{ color: "#171717" }}>
          BookTok for Millennials
        </h2>
        <p className="mb-6" style={{ color: "#737373" }}>
          Sign up or log in to start posting and following.
        </p>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="outline">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 w-full">
      {/* Search bar */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "#a3a3a3" }}
        />
        <Input placeholder="Search books or posts..." className="pl-9" />
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {DUMMY_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
