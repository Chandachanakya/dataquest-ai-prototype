import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { storage } from "@/lib/storage";
import { User, ForumPost, ForumReply } from "@/lib/types";
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Forum = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTopic, setNewPostTopic] = useState("General");
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    setUser(currentUser);
    loadPosts();
  }, [navigate]);

  const loadPosts = () => {
    const allPosts = storage.getForumPosts();
    setPosts(allPosts);
  };

  const handleCreatePost = () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const post: ForumPost = {
      id: `post-${Date.now()}`,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      title: newPostTitle,
      content: newPostContent,
      topic: newPostTopic,
      likes: 0,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    storage.saveForumPost(post);
    loadPosts();
    setNewPostTitle("");
    setNewPostContent("");
    setNewPostOpen(false);
    toast.success("Post created successfully!");
  };

  const handleLikePost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      storage.updateForumPost(postId, { likes: post.likes + 1 });
      loadPosts();
    }
  };

  const handleReply = () => {
    if (!user || !selectedPost || !replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    const reply: ForumReply = {
      id: `reply-${Date.now()}`,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      content: replyContent,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedReplies = [...selectedPost.replies, reply];
    storage.updateForumPost(selectedPost.id, { replies: updatedReplies });
    loadPosts();
    setReplyContent("");
    
    // Update selected post to reflect new reply
    const updatedPost = { ...selectedPost, replies: updatedReplies };
    setSelectedPost(updatedPost);
    toast.success("Reply posted!");
  };

  if (!user) return null;

  const topicColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Python: "bg-blue-500/10 text-blue-500",
    "Data Science": "bg-purple-500/10 text-purple-500",
    SQL: "bg-green-500/10 text-green-500",
    "Machine Learning": "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Discussion Forum
              </h1>
              <p className="text-muted-foreground">Connect with fellow learners</p>
            </div>
            <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>Share your thoughts with the community</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Post title"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                  <select
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={newPostTopic}
                    onChange={(e) => setNewPostTopic(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Python">Python</option>
                    <option value="Data Science">Data Science</option>
                    <option value="SQL">SQL</option>
                    <option value="Machine Learning">Machine Learning</option>
                  </select>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={5}
                  />
                  <Button onClick={handleCreatePost} className="w-full">
                    Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to start a discussion!</p>
              <Button onClick={() => setNewPostOpen(true)}>Create First Post</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Posts List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Discussions</h2>
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPost(post)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">{post.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{post.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">by {post.username}</p>
                        </div>
                      </div>
                      <Badge className={topicColors[post.topic] || "bg-muted"}>
                        {post.topic}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePost(post.id);
                        }}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes}
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.replies.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Post Detail */}
            <div className="sticky top-4 h-fit">
              {selectedPost ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{selectedPost.avatar}</span>
                      <div>
                        <CardTitle className="text-lg">{selectedPost.username}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedPost.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={topicColors[selectedPost.topic] || "bg-muted"}>
                      {selectedPost.topic}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{selectedPost.title}</h3>
                      <p className="text-sm">{selectedPost.content}</p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Replies ({selectedPost.replies.length})</h4>
                      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                        {selectedPost.replies.map((reply) => (
                          <div key={reply.id} className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{reply.avatar}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{reply.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                        />
                        <Button onClick={handleReply} size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a post to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forum;
