"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./landingPage.module.css";

export type SimpleArtist = {
  firebase_uid?: string;
  username?: string;
  name?: string;
  artType?: string;
  profil_url?: string;
  avatar_url?: string;
};

type Props = {
  artists: SimpleArtist[];
};

type FollowDoc = {
  following_user_id: string;
  followed_user_id: string;
};

export default function ArtistsToFollowClient({ artists }: Props) {
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fromStorage =
      window.localStorage.getItem("firebase_uid") ??
      window.localStorage.getItem("firebaseUid") ??
      window.localStorage.getItem("userId");

    setCurrentUid(fromStorage || null);
  }, []);

  useEffect(() => {
    if (!currentUid) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/follows?userId=${encodeURIComponent(
            currentUid
          )}&type=following`
        );

        if (!res.ok) {
          console.error("Failed to load following list on landing page");
          return;
        }

        const data: FollowDoc[] = await res.json();

        if (!cancelled) {
          const ids = new Set<string>(
            data.map((f) => f.followed_user_id).filter(Boolean)
          );
          setFollowingIds(ids);
        }
      } catch (err) {
        console.error("Failed to load following list on landing page", err);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  const artistsToShow = useMemo(
    () =>
      artists.filter((a) => {
        if (!a.firebase_uid) return false;
        if (!currentUid) return true;
        return a.firebase_uid !== currentUid;
      }),
    [artists, currentUid]
  );

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUid || currentUid === targetUid) return;

    const isAlreadyFollowing = followingIds.has(targetUid);

    try {
      setTogglingUid(targetUid);

      const method = isAlreadyFollowing ? "DELETE" : "POST";

      const res = await fetch("/api/follows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          following_user_id: currentUid,
          followed_user_id: targetUid,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to toggle follow on landing page", errText);
        alert("Something went wrong. Please try again.");
        return;
      }

      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isAlreadyFollowing) {
          next.delete(targetUid);
        } else {
          next.add(targetUid);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to toggle follow on landing page", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setTogglingUid(null);
    }
  };

  if (!artistsToShow.length) {
    return null;
  }

  return (
    <ul className={styles.artistList}>
      {artistsToShow.map((a) => {
        const avatarSrc = a.profil_url || a.avatar_url || "";
        const targetUid = a.firebase_uid!;
        const isFollowing = followingIds.has(targetUid);

        return (
          <li key={targetUid} className={styles.artistRow}>
            <div className={styles.avatarWrap}>
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={a.username || a.name || "Artist"}
                  width={40}
                  height={40}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatar}>
                  {(a.username?.[0] ?? a.name?.[0] ?? "?").toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.artistInfo}>
              <div className={styles.artistName}>
                {a.name ?? a.username ?? "Unknown"}
              </div>
              <div className={styles.artistType}>{a.artType ?? "Artist"}</div>
            </div>

            {currentUid && (
              <button
                type="button"
                className={styles.followBtn}
                disabled={togglingUid === targetUid}
                onClick={() => handleToggleFollow(targetUid)}
              >
                {togglingUid === targetUid
                  ? "Saving..."
                  : isFollowing
                  ? "Unfollow"
                  : "Follow"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
