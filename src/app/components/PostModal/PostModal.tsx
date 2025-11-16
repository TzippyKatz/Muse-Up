"use client";

import { useState } from "react";
import styles from "./PostModal.module.css";

type PostModalProps = {
  onClose: () => void;
  post: {
    title?: string;
    image_url?: string;
    likes_count?: number;
  };
};

export default function PostModal({ onClose, post }: PostModalProps) {
  const [commentText, setCommentText] = useState("");

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalBox}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.content}>
          <div className={styles.left}>
            <h2 className={styles.postTitle}>{post.title ?? "Untitled"}</h2>

            <p className={styles.postText}>
              Here will be the post description or story text. For now this is
              just placeholder content so we can design the layout.
            </p>

            <p className={styles.postText}>
              You can later replace this with the real description that comes
              from your Post model.
            </p>

            <div className={styles.actionsRow}>
              <span>❤️ {post.likes_count ?? 0} likes</span>
            </div>

            <div className={styles.commentRow}>
              <input
                className={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}                 // ← חדש
                onChange={(e) => setCommentText(e.target.value)} // ← חדש
              />
              <button className={styles.emojiBtn}>😊</button>
            </div>
          </div>

          <div className={styles.right}>
            {post.image_url ? (
              <img src={post.image_url} alt={post.title ?? "post"} />
            ) : (
              <div className={styles.noImage}>no image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 