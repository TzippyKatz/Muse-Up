"use client";

import { useState, useRef, type FormEvent } from "react";
import styles from "./PostModal.module.css";

import { savePost, unsavePost } from "../../../services/postService";
import { useFirebaseUid } from "../../../hooks/useFirebaseUid";

import useModalUI from "../../../hooks/useModalUI";
import { usePost } from "../../../hooks/usePost";
import { useComments } from "../../../hooks/useComments";

import { Share2, Copy, Mail, Send, MessageCircle } from "lucide-react";
type Props = {
  onClose: () => void;
  postId: string;
};

type Comment = {
  id: number;
  post_id: string;
  user_id: string;
  body: string;
};
export default function PostModal({ onClose, postId }: Props) {
  const { uid } = useFirebaseUid();

  /* ✨ React Query Data */
  const {
    data: post,
    isLoading: loadingPost,
  } = usePost(postId);

  const {
    data: comments = [],
    isLoading: loadingComments,
  } = useComments(postId);

  /* ✨ Local UI State */
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes_count ?? 0);
  const [savingLike, setSavingLike] = useState(false);

  const [saved, setSaved] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShare, setShowShare] = useState(false);

  /* ✨ Refs */
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const shareRef = useRef<HTMLDivElement | null>(null);
  useModalUI({
    autoFocusRef: inputRef,
    emojiRef,
    shareRef,
    commentsRef,
    scrollDeps: [comments.length],
    onCloseEmoji: () => setShowEmojiPicker(false),
    onCloseShare: () => setShowShare(false),
  });
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || sending) return;

    setSending(true);

    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          user_id: uid,
          body: commentText,
        }),
      });

      if (!res.ok) return;

      setCommentText("");
    } finally {
      setSending(false);
    }
  }
  async function handleLike() {
    if (savingLike || !post) return;

    const newLiked = !liked;
    const delta = newLiked ? 1 : -1;

    setLiked(newLiked);
    setLikes((prev) => prev + delta);
    setSavingLike(true);

    try {
      await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
    } finally {
      setSavingLike(false);
    }
  }
  async function handleSave() {
    if (!uid || !post?.id) return;
    const newSaved = !saved;
    setSaved(newSaved);

    try {
      if (newSaved) {
        await savePost(uid, post.id);
      } else {
        await unsavePost(uid, post.id);
      }
    } catch {
      setSaved(!newSaved);
    }
  }
  function copyShareLink() {
    if (!post?.id) return;
    const shareUrl = `${window.location.origin}/landing?postId=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShare(false);
  }

  function shareWhatsApp() {
    if (!post?.id) return;
    const shareUrl = `${window.location.origin}/landing?postId=${post.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`);
    setShowShare(false);
  }

  function shareEmail() {
    if (!post?.id) return;
    const shareUrl = `${window.location.origin}/landing?postId=${post.id}`;
    window.location.href = `mailto:?subject=Check this out&body=${encodeURIComponent(
      shareUrl
    )}`;
    setShowShare(false);
  }

  /* --------------------------------------------- */

  return (
    <div className={styles.bg}>
      <div className={styles.box}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.inner}>
          {/* LEFT SIDE */}
          <div className={styles.left}>
            <h2 className={styles.title}>
              {loadingPost ? "Loading…" : post?.title}
            </h2>

            <p className={styles.body}>
              {loadingPost ? "Loading…" : post?.body}
            </p>

            {/* ICON BUTTONS */}
            <div className={styles.icons}>
              <button
                className={`${styles.iconBtn} ${liked ? styles.active : ""}`}
                onClick={handleLike}
              >
                {liked ? "❤️" : "♡"}
              </button>

              <button
                className={`${styles.iconBtn} ${saved ? styles.saved : ""}`}
                onClick={handleSave}
              >
                {saved ? "✓" : "＋"}
              </button>

              <button className={styles.iconBtn} onClick={() => setShowShare(v => !v)}>
                <Share2 size={22} strokeWidth={1.8} />
              </button>
            </div>

            {/* SHARE MENU */}
            {showShare && (
              <div ref={shareRef} className={styles.shareMenu}>

                <button className={styles.shareItem} onClick={copyShareLink}>
                  <Copy size={18} /> Copy link
                </button>

                <button className={styles.shareItem} onClick={shareWhatsApp}>
                  <MessageCircle size={18} /> WhatsApp
                </button>

                <button className={styles.shareItem} onClick={shareEmail}>
                  <Mail size={18} /> Email
                </button>

                {navigator.share && (
                  <button
                    className={styles.shareItem}
                    onClick={() => {
                      navigator.share({
                        title: post?.title,
                        text: post?.body,
                        url: `${window.location.origin}/landing?postId=${post?.id}`,
                      });
                      setShowShare(false);
                    }}
                  >
                    <Send size={18} /> Share (device)
                  </button>
                )}

              </div>
            )}

            {/* META */}
            <div className={styles.meta}>
              <span>{post?.author?.followers_count ?? 0} followers</span>
              <span className={styles.sep}>|</span>
              <span>{likes} likes</span>
              <span className={styles.sep}>|</span>

              <div className={styles.authorBox}>
                <img
                  src={post?.author?.avatar_url}
                  className={styles.authorAvatar}
                />
                <span className={styles.authorName}>
                  {post?.author?.name}
                </span>
              </div>
            </div>

            {/* COMMENTS */}
            <div ref={commentsRef} className={styles.comments}>
              {loadingComments ? (
                <p className={styles.muted}>Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className={styles.muted}>No comments yet.</p>
              ) : (
                comments.map((c: Comment) => (
                  <div key={c.id} className={styles.comment}>
                    {c.body}
                  </div>
                ))
              )}
            </div>

            {/* ADD COMMENT */}
            <form className={styles.inputRow} onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />

              <button
                type="button"
                className={styles.emoji}
                onClick={() => setShowEmojiPicker(v => !v)}
              >
                😊
              </button>
            </form>

            {/* EMOJI PICKER */}
            {showEmojiPicker && (
              <div ref={emojiRef} className={styles.emojiPicker}>
                {["😊", "😂", "😍", "🥰", "😎", "🔥", "👍"].map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={styles.emojiItem}
                    onClick={() => setCommentText(t => t + em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE (IMAGE) */}
          <div className={styles.right}>
            {post?.image_url ? (
              <img
                src={post.image_url}
                className={styles.image}
                alt={post?.title || "Artwork"}
              />
            ) : (
              <div className={styles.noImage}>No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
