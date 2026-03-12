
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ForumPost = Tables<'forum_posts'> & { replies: Tables<'forum_replies'>[] };
type ForumReply = Tables<'forum_replies'>;

const Forum = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTopic, setNewPostTopic] = useState("General");
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();

    const changes = supabase.channel('table-db-changes')
      .on<Tables<'forum_posts'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'forum_posts' },
        (payload) => {
          console.log('Change received!', payload)
          loadPosts();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(changes)
    };
  }, []);

  useEffect(() => {
    if (selectedPost) {
      loadPostDetails(selectedPost.id);
    }
  }, [selectedPost?.id]);

  const loadPosts = async () => {
    setLoading(true);
    const { data: postsData, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        replies:forum_replies(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load posts.");
      console.error(error);
    } else {
      setPosts(postsData as any);
    }
    setLoading(false);
  };

  const loadPostDetails = async (postId: string) => {
    const { data: postData, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        replies:forum_replies(*)
      `)
      .eq('id', postId)
      .order('created_at', { referencedTable: 'forum_replies', ascending: true })
      .single();

    if (error) {
      toast.error("Failed to load post details.");
    } else {
      setSelectedPost(postData as any);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !profile) {
      toast.error("Please log in to create a post.");
      return;
    }
    if (newPostTitle.trim().length <= 5) {
      toast.error("Title must be longer than 5 characters.");
      return;
    }
    if (newPostContent.trim().length <= 10) {
      toast.error("Post content must be longer than 10 characters.");
      return;
    }

    setIsCreatingPost(true);
    try {
      const { error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        username: profile.username,
        avatar: profile.avatar,
        title: newPostTitle,
        content: newPostContent,
        topic: newPostTopic,
      });

      if (error) throw error;

      setNewPostTitle("");
      setNewPostContent("");
      setNewPostOpen(false);
      toast.success("Post created successfully!");
    } catch (error: any) {
      toast.error("Failed to create post.", {
        description: error.message,
      });
      console.error('Failed to create post', error);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a post.");
      return;
    }
    const post = posts.find(p => p.id === postId);
    if (post) {
      const { error } = await supabase
        .from('forum_posts')
        .update({ likes: (post.likes || 0) + 1 })
        .eq('id', postId);

      if (error) toast.error("Failed to like post.");
    }
  };

  const handleReply = async () => {
    if (!user || !profile || !selectedPost || !replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    const { error } = await supabase.from('forum_replies').insert({
      post_id: selectedPost.id,
      user_id: user.id,
      username: profile.username,
      avatar: profile.avatar,
      content: replyContent,
    });

    if (error) {
      toast.error("Failed to post reply.");
    } else {
      setReplyContent("");
      loadPostDetails(selectedPost.id)
      toast.success("Reply posted!");
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId || !user) return;

    const post = posts.find(p => p.id === deletePostId);

    // Verify ownership
    if (!post || post.user_id !== user.id) {
      toast.error("You can only delete your own posts");
      setDeletePostId(null);
      return;
    }

    // Delete from database
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', deletePostId);

    if (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } else {
      toast.success("Post deleted successfully");
      // Clear selected post if it was the deleted one
      if (selectedPost?.id === deletePostId) {
        setSelectedPost(null);
      }
    }

    setDeletePostId(null);
  };

  const handleDeleteReply = async () => {
    if (!deleteReplyId || !user || !selectedPost) return;

    const reply = selectedPost.replies.find(r => r.id === deleteReplyId);

    // Verify ownership
    if (!reply || reply.user_id !== user.id) {
      toast.error("You can only delete your own replies");
      setDeleteReplyId(null);
      return;
    }

    // Delete from database
    const { error } = await supabase
      .from('forum_replies')
      .delete()
      .eq('id', deleteReplyId);

    if (error) {
      toast.error("Failed to delete reply");
      console.error(error);
    } else {
      toast.success("Reply deleted successfully");
      // Reload post details to refresh replies
      loadPostDetails(selectedPost.id);
    }

    setDeleteReplyId(null);
  };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {user && (
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
                    <DialogDescription>
                      Share your thoughts with the community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Post title"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                      />
                      {newPostTitle.trim().length > 0 && newPostTitle.trim().length <= 5 && (
                        <p className="text-red-500 text-xs mt-1">Title must be longer than 5 characters.</p>
                      )}
                    </div>
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
                    <div>
                      <Textarea
                        placeholder="What's on your mind?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={5}
                      />
                      {newPostContent.trim().length > 0 && newPostContent.trim().length <= 10 && (
                        <p className="text-red-500 text-xs mt-1">Content must be longer than 10 characters.</p>
                      )}
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      className="w-full"
                      disabled={newPostTitle.trim().length <= 5 || newPostContent.trim().length <= 10 || isCreatingPost}
                    >
                      {isCreatingPost && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to start a discussion!
              </p>
              {user && (
                <Button onClick={() => setNewPostOpen(true)}>
                  Create First Post
                </Button>
              )}
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
                          <CardTitle className="text-base truncate">
                            {post.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {post.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={topicColors[post.topic] || "bg-muted"}
                        >
                          {post.topic}
                        </Badge>
                        {user && post.user_id === user.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletePostId(post.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
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
                        <CardTitle className="text-lg">
                          {selectedPost.username}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            selectedPost.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        topicColors[selectedPost.topic] || "bg-muted"
                      }
                    >
                      {selectedPost.topic}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        {selectedPost.title}
                      </h3>
                      <p className="text-sm">{selectedPost.content}</p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">
                        Replies ({selectedPost.replies.length})
                      </h4>
                      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                        {selectedPost.replies.map((reply: any) => (
                          <div
                            key={reply.id}
                            className="bg-muted/50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{reply.avatar}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {reply.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    reply.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              {user && reply.user_id === user.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setDeleteReplyId(reply.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>

                      {user && (
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a post to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Delete Post Confirmation Dialog */}
      <Dialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your post and all its replies.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeletePostId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Reply Confirmation Dialog */}
      <Dialog open={!!deleteReplyId} onOpenChange={() => setDeleteReplyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reply?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your reply.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteReplyId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReply}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forum;
