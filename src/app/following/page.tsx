"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./following.module.css";

type UserSummary = {
  _id: string;
  name: string;
  username: string;
  profil_url?: string;
  bio?: string;
};

export default function FollowingPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const firebaseUid = window.localStorage.getItem("firebase_uid");
    const legacyId = window.localStorage.getItem("userId");

    const idToUse = firebaseUid ?? legacyId;

    if (idToUse) {
      setCurrentUserId(idToUse);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchFollowing = async () => {
      try {
        const res = await fetch(`/api/following-users?userId=${currentUserId}`);
        if (!res.ok) throw new Error("Failed to fetch following");
        const data = await res.json();
        setFollowingUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching following", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [currentUserId]);


  const handleUnfollow = async (targetId: string) => {
    if (!currentUserId) return;

    try {
      const res = await fetch("/api/followers-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId, 
          followerId: targetId,  
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Failed to unfollow", res.status, body);
        return;
      }

      setFollowingUsers((prev) => prev.filter((u) => u._id !== targetId));
    } catch (err) {
      console.error("Error in handleUnfollow", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Following</h1>
        <p>טוען...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Following</h1>
        <p>לא נמצא משתמש מחובר.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Following</h1>

      {followingUsers.length === 0 ? (
        <p>את לא עוקבת אחרי אף אחד כרגע.</p>
      ) : (
        <div className={styles.cards}>
          {followingUsers.map((user) => (
            <div className={styles.card} key={user._id}>
              <div className={styles.avatarWrapper}>
                <Image
                  src={
                    user.profil_url && user.profil_url.trim() !== ""
                      ? user.profil_url
                      : "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763545782/45d4e069425e26a062a08f62116db827_ajjxke.jpg"
                  }
                  alt={user.username || "user avatar"}
                  width={72}
                  height={72}
                />
              </div>

              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{user.name}</span>
                  <span className={styles.username}>@{user.username}</span>
                </div>
                {user.bio && <p className={styles.bio}>{user.bio}</p>}
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.button} ${styles.buttonFollowing}`}
                  onClick={() => handleUnfollow(user._id)}
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
