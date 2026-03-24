"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addComment, deleteComment } from "@/lib/actions/comment-actions";
import { toast } from "sonner";

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  user: {
    id: string;
    username: string | null;
    imageUrl: string | null;
  };
  replies: {
    id: string;
    body: string;
    createdAt: Date;
    user: {
      id: string;
      username: string | null;
      imageUrl: string | null;
    };
  }[];
}

export function ListComments({
  listId,
  comments,
  currentUserId,
  isSignedIn,
}: {
  listId: string;
  comments: Comment[];
  currentUserId: string | null;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (parentId?: string) => {
    const text = parentId ? replyBody : body;
    if (!text.trim()) return;

    startTransition(async () => {
      try {
        await addComment(listId, text, parentId);
        if (parentId) {
          setReplyBody("");
          setReplyTo(null);
        } else {
          setBody("");
        }
        router.refresh();
        toast.success("Comment added");
      } catch {
        toast.error("Failed to add comment");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      try {
        await deleteComment(commentId);
        router.refresh();
        toast.success("Comment deleted");
      } catch {
        toast.error("Failed to delete comment");
      }
    });
  };

  const now = useMemo(() => Date.now(), []);
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-bold">
        Comments ({comments.reduce((n, c) => n + 1 + c.replies.length, 0)})
      </h3>

      {/* New comment */}
      {isSignedIn ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts about this list..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSubmit()}
              disabled={isPending || !body.trim()}
            >
              Comment
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Sign in to leave a comment.
        </p>
      )}

      {/* Comment list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.imageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(comment.user.username ?? "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.user.username ?? "User"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{comment.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {isSignedIn && (
                      <button
                        className="text-muted-foreground hover:text-foreground text-xs"
                        onClick={() =>
                          setReplyTo(
                            replyTo === comment.id ? null : comment.id
                          )
                        }
                      >
                        Reply
                      </button>
                    )}
                    {currentUserId === comment.user.id && (
                      <button
                        className="text-muted-foreground hover:text-destructive text-xs"
                        onClick={() => handleDelete(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reply form */}
            {replyTo === comment.id && (
              <div className="ml-10 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={2}
                  className="resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyBody("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(comment.id)}
                    disabled={isPending || !replyBody.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="ml-10 space-y-2">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="bg-muted/50 rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={reply.user.imageUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(reply.user.username ?? "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {reply.user.username ?? "User"}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {timeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm whitespace-pre-wrap">{reply.body}</p>
                        {currentUserId === reply.user.id && (
                          <button
                            className="text-muted-foreground hover:text-destructive mt-1 text-xs"
                            onClick={() => handleDelete(reply.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
