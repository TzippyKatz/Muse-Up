"use client";
import { useState, MouseEvent } from "react";
import styles from "./profile.module.css";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Pencil, Trash2 } from "lucide-react";

import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import {
  useProfileEditForm,
} from "../../hooks/useProfileEditForm";

import {
  getUserByUid,
  type User,
} from "../../services/userService";

import {
  getUserPosts,
  type PostCard,
} from "../../services/postService";

import {
  getFollowersForUser,
  getFollowingForUser,
  type SimpleUser,
} from "../../services/followService";

import { getSavedPosts } from "../../services/savedPostService";
import PostModal from "../components/PostModal/PostModal";

type TabKey =
  | "posts"
  | "saved"
  | "collections"
  | "challenge"
  | "edit"
  | "followers"
  | "following";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { uid, ready: uidReady } = useFirebaseUid();

  const { data: user } = useQuery<User>({
    queryKey: ["user", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: uidReady && !!uid,
  });

  useProfileEditForm(user ?? null); // כדי למנוע קריסה

  const { data: posts = [] } = useQuery<PostCard[]>({
    queryKey: ["posts", user?._id],
    queryFn: () => getUserPosts(user!._id),
    enabled: !!user && activeTab === "posts",
  });

  const { data: savedPosts = [] } = useQuery<PostCard[]>({
    queryKey: ["savedPosts"],
    queryFn: getSavedPosts,
    enabled: activeTab === "saved",
  });

  const { data: followers = [] } = useQuery<SimpleUser[]>({
    queryKey: ["followers", user?.firebase_uid],
    queryFn: () => getFollowersForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "followers",
  });

  const { data: following = [] } = useQuery<SimpleUser[]>({
    queryKey: ["following", user?.firebase_uid],
    queryFn: () => getFollowingForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "following",
  });

  if (!uidReady) return <div className={styles.page}>Loading…</div>;
  if (!uid) return <div className={styles.page}>Not signed in.</div>;
  if (!user) return <div className={styles.page}>Failed to load.</div>;

  function stopClick(e: MouseEvent) {
    e.stopPropagation();
  }

  // ---------------- DELETE POST ----------------
  async function handleDeletePost(e: MouseEvent, postId: string) {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) return console.error("Failed to delete post");

      console.log("Deleted:", postId);

      queryClient.invalidateQueries({
        queryKey: ["posts", user?._id],
      });
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  // ---------------- EDIT POST ----------------
  function handleEditPost(e: MouseEvent, postId: string) {
    e.stopPropagation();
    router.push(`/edit-post/${postId}`);
  }

  // -----------------------------------------------------

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          {user.profil_url ? (
            <img src={user.profil_url} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className={styles.headerText}>
          <h1 className={styles.name}>{user.name ?? user.username}</h1>

          <div className={styles.metaRow}>
            <button
              className={styles.metaItemButton}
              onClick={() => setActiveTab("followers")}
            >
              {user.followers_count ?? 0} followers
            </button>
            <span className={styles.divider}>|</span>
            <button
              className={styles.metaItemButton}
              onClick={() => setActiveTab("following")}
            >
              {user.following_count ?? 0} following
            </button>
          </div>

          {user.bio && <p className={styles.bio}>{user.bio}</p>}
          {user.location && <p className={styles.location}>{user.location}</p>}
        </div>
      </header>

      {/* TABS */}
      <nav className={styles.tabs}>
        {[
          ["posts", "My Posts"],
          ["saved", "Saved"],
          ["collections", "Collections"],
          ["challenge", "Challenge"],
          ["edit", "Edit"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${
              activeTab === key ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(key as TabKey)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <section className={styles.content}>
        {/* POSTS */}
        {activeTab === "posts" && (
          <div className={styles.postsSection}>
            <button
              className={styles.shareArtBtn}
              onClick={() => router.push("/create")}
            >
              share your art <span className={styles.sharePlus}>+</span>
            </button>

            <div className={styles.postsGrid}>
              {posts.map((p) => (
                <div
                  key={p._id}
                  className={styles.postCard}
                  onClick={() => setSelectedPostId(p._id)}
                >
                  <img src={p.image_url} className={styles.postImage} />

                  {/* ACTION BUTTONS */}
                  <div className={styles.postActions}>
                    <button
                      className={styles.postActionBtn}
                      onClick={(e) => {
                        stopClick(e);
                        handleEditPost(e, p._id);
                      }}
                    >
                      <Pencil size={18} className={styles.icon} />
                    </button>

                    <button
                      className={styles.postActionBtn}
                      onClick={(e) => handleDeletePost(e, p._id)}
                    >
                      <Trash2 size={18} className={styles.iconDelete} />
                    </button>
                  </div>

                  <div className={styles.postInfo}>
                    <h3 className={styles.postTitle}>{p.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAVED */}
        {activeTab === "saved" && (
          <div className={styles.postsGrid}>
            {savedPosts.map((p) => (
              <div
                key={p._id}
                className={styles.postCard}
                onClick={() => setSelectedPostId(p._id)}
              >
                <img src={p.image_url} className={styles.postImage} />
                <div className={styles.postInfo}>
                  <h3 className={styles.postTitle}>{p.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOLLOWERS */}
        {activeTab === "followers" && (
          <div className={styles.followersSection}>
            {followers.map((f) => (
              <div key={f._id} className={styles.followerCard}>
                <img src={f.profil_url || ""} className={styles.followerAvatar} />
                <div>
                  <div className={styles.followerName}>{f.name ?? f.username}</div>
                  <div className={styles.followerUsername}>@{f.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOLLOWING */}
        {activeTab === "following" && (
          <div className={styles.followersSection}>
            {following.map((f) => (
              <div key={f._id} className={styles.followerCard}>
                <img src={f.profil_url || ""} className={styles.followerAvatar} />
                <div>
                  <div className={styles.followerName}>{f.name ?? f.username}</div>
                  <div className={styles.followerUsername}>@{f.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
