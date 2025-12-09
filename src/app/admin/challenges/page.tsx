"use client";
import { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "./adminChallenges.module.css";
type Challenge = {
  _id: string;
  id: number;
  title: string;
  description?: string;
  picture_url?: string;
  status: string;
  start_date: string;
  end_date: string;
  winners_published?: boolean;
};
type NewChallengePayload = {
  title: string;
  description: string;
  picture_url: string;
  start_date: string; 
  end_date: string; 
};
type Submission = {
  _id: string;
  challenge_id: number;
  user_id: string; 
  image_url?: string;
  createdAt?: string;
  user?: {
    firebase_uid: string;
    username?: string;
    name?: string;
    profil_url?: string;
  } | null;
};
type WinnerPayload = {
  user_id: string;
  submission_id: string;
  place: 1 | 2 | 3;
};
async function fetchAdminChallenges(): Promise<Challenge[]> {
  const res = await fetch("/api/admin/challenges", {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load admin challenges");
  }
  return data;
}
async function createAdminChallenge(
  payload: NewChallengePayload
): Promise<Challenge> {
  const res = await fetch("/api/admin/challenges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to create challenge");
  }
  return data;
}
async function fetchChallengeSubmissions(
  challengeId: number
): Promise<Submission[]> {
  const res = await fetch(
    `/api/admin/challenges/${challengeId}/submissions`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load submissions");
  }
  return data;
}
async function updateWinners(params: {
  challengeId: number;
  winners: WinnerPayload[];
  publish: boolean;
}): Promise<Challenge> {
  const res = await fetch(`/api/admin/challenges/${params.challengeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      winners: params.winners,
      publish: params.publish,
      status: "ended",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to update winners");
  }
  return data;
}
function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
export default function AdminChallengesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<NewChallengePayload>({
    title: "",
    description: "",
    picture_url: "",
    start_date: "",
    end_date: "",
  });
  const [selectedChallenge, setSelectedChallenge] =
    useState<Challenge | null>(null);
  const [isWinnersOpen, setIsWinnersOpen] = useState(false);
  const [winners, setWinners] = useState<WinnerPayload[]>([]);
  const {
    data: challenges,
    isLoading,
    error,
  } = useQuery<Challenge[], Error>({
    queryKey: ["adminChallenges"],
    queryFn: fetchAdminChallenges,
  });
  const createMutation = useMutation({
    mutationFn: createAdminChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChallenges"] });
      setForm({
        title: "",
        description: "",
        picture_url: "",
        start_date: "",
        end_date: "",
      });
      setIsFormOpen(false);
    },
  });
  const winnersMutation = useMutation({
    mutationFn: updateWinners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChallenges"] });
      if (selectedChallenge) {
        queryClient.invalidateQueries({
          queryKey: ["adminChallengeSubmissions", selectedChallenge.id],
        });
      }
      setIsWinnersOpen(false);
      setWinners([]);
    },
  });
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.end_date) {
      alert("חובה למלא לפחות שם אתגר, תאריך התחלה ותאריך סיום");
      return;
    }
    createMutation.mutate(form);
  };
  const openWinnersModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setWinners([]);
    setIsWinnersOpen(true);
  };
  const closeWinnersModal = () => {
    if (winnersMutation.isPending) return;
    setIsWinnersOpen(false);
    setSelectedChallenge(null);
    setWinners([]);
  };
  const selectPlace = (submission: Submission, place: 1 | 2 | 3) => {
    setWinners((prev) => {
      const filtered = prev.filter(
        (w) => w.place !== place && w.submission_id !== submission._id
      );
      return [
        ...filtered,
        {
          user_id: submission.user_id,
          submission_id: submission._id,
          place,
        },
      ];
    });
  };
  const isSelected = (submissionId: string, place: 1 | 2 | 3) =>
    winners.some((w) => w.submission_id === submissionId && w.place === place);
  const renderError = () => {
    if (!error) return null;
    const msg = error.message || "";
    const isUnauthorized =
      msg.toLowerCase().includes("unauthorized") || msg.includes("403");
    if (isUnauthorized) {
      return (
        <div className={styles.errorBox}>
          <p>אין לך הרשאה לצפות בעמוד זה.</p>
          <p>תוודאי שב־Mongo המשתמש שלך מוגדר עם role = "admin".</p>
        </div>
      );
    }
    return (
      <div className={styles.errorBox}>
        <p>אירעה שגיאה בטעינת האתגרים.</p>
        <p>{msg}</p>
      </div>
    );
  };
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>ניהול אתגרים</h1>
          <p className={styles.subtitle}>
            כאן את יכולה ליצור אתגרים חדשים, ולעקוב אחרי מצב האתגרים הקיימים.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setIsFormOpen((prev) => !prev)}
        >
          {isFormOpen ? "סגירת טופס יצירה" : "צור אתגר חדש"}
        </button>
      </div>
      {isFormOpen && (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>אתגר חדש</h2>
          <div className={styles.formRow}>
            <label className={styles.label}>
              שם האתגר
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={styles.input}
                placeholder="לדוגמה: פורטרט בשחור־לבן"
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              תיאור
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="כמה מילים על מטרת האתגר, כללים, וכו׳"
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              כתובת תמונה (אופציונלי)
              <input
                type="text"
                name="picture_url"
                value={form.picture_url}
                onChange={handleChange}
                className={styles.input}
                placeholder="https://..."
              />
            </label>
          </div>
          <div className={styles.formRowGrid}>
            <label className={styles.label}>
              תאריך התחלה
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              תאריך סיום
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className={styles.input}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setIsFormOpen(false)}
              disabled={createMutation.isPending}
            >
              ביטול
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "שומרת..." : "שמור אתגר"}
            </button>
          </div>
          {createMutation.error && (
            <div className={styles.errorText}>
              {(createMutation.error as Error).message}
            </div>
          )}
        </form>
      )}
      {isLoading && !error && (
        <div className={styles.loading}>טוען אתגרים…</div>
      )}
      {renderError()}
      {!isLoading && !error && challenges && (
        <div className={styles.list}>
          {challenges.length === 0 && (
            <div className={styles.emptyState}>
              עדיין לא יצרת אתגרים. לחצי על &quot;צור אתגר חדש&quot; כדי להתחיל.
            </div>
          )}
          {challenges.map((ch) => (
            <div key={ch._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    {ch.title} <span className={styles.cardId}>#{ch.id}</span>
                  </h3>
                  <p className={styles.cardStatus}>
                    סטטוס: <span>{ch.status}</span>
                    {ch.winners_published && (
                      <span className={styles.publishedBadge}>
                        · הזוכים פורסמו
                      </span>
                    )}
                  </p>
                </div>
                {ch.picture_url && (
                  <img
                    src={ch.picture_url}
                    alt={ch.title}
                    className={styles.cardImage}
                  />
                )}
              </div>
              <p className={styles.cardDates}>
                {formatDate(ch.start_date)} — {formatDate(ch.end_date)}
              </p>
              {ch.description && (
                <p className={styles.cardDescription}>{ch.description}</p>
              )}
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.outlineButtonActive}
                  onClick={() => openWinnersModal(ch)}
                >
                  ניהול זוכים
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {isWinnersOpen && selectedChallenge && (
        <WinnersModal
          challenge={selectedChallenge}
          onClose={closeWinnersModal}
          winners={winners}
          selectPlace={selectPlace}
          isSelected={isSelected}
          winnersMutation={winnersMutation}
        />
      )}
    </div>
  );
}
type WinnersModalProps = {
  challenge: Challenge;
  onClose: () => void;
  winners: WinnerPayload[];
  selectPlace: (submission: Submission, place: 1 | 2 | 3) => void;
  isSelected: (submissionId: string, place: 1 | 2 | 3) => boolean;
  winnersMutation: {
    isPending: boolean;
    error: unknown;
    mutate: (args: {
      challengeId: number;
      winners: WinnerPayload[];
      publish: boolean;
    }) => void;
  };
};
function WinnersModal({
  challenge,
  onClose,
  winners,
  selectPlace,
  isSelected,
  winnersMutation,
}: WinnersModalProps) {
  const { data, isLoading, error } = useQuery<Submission[], Error>({
    queryKey: ["adminChallengeSubmissions", challenge.id],
    queryFn: () => fetchChallengeSubmissions(challenge.id),
  });
  const handleSave = () => {
    if (!winners || winners.length === 0) {
      alert("בחרי לפחות זוכה אחד לפני השמירה.");
      return;
    }
    winnersMutation.mutate({
      challengeId: challenge.id,
      winners,
      publish: true,
    });
  };
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              ניהול זוכים – {challenge.title}
            </h2>
            <p className={styles.modalSubtitle}>
              בחרי מקום 1, 2 ו־3 מתוך ההגשות שהוגשו לאתגר.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={winnersMutation.isPending}
          >
            ✕
          </button>
        </div>
        {isLoading && <div className={styles.loading}>טוען הגשות…</div>}
        {error && (
          <div className={styles.errorBox}>
            <p>אירעה שגיאה בטעינת ההגשות.</p>
            <p>{error.message}</p>
          </div>
        )}
        {!isLoading && !error && data && data.length === 0 && (
          <div className={styles.emptyState}>
            עדיין אין הגשות לאתגר הזה.
          </div>
        )}
        {!isLoading && !error && data && data.length > 0 && (
          <div className={styles.submissionsList}>
            {data.map((sub) => {
              const displayName =
                sub.user?.username || sub.user?.name || sub.user?.firebase_uid;
              return (
                <div key={sub._id} className={styles.submissionCard}>
                  {sub.image_url && (
                    <img
                      src={sub.image_url}
                      alt={displayName || "submission image"}
                      className={styles.submissionImage}
                    />
                  )}

                  <div className={styles.submissionInfo}>
                    <div className={styles.submissionUser}>
                      {sub.user?.profil_url && (
                        <img
                          src={sub.user.profil_url}
                          alt={displayName || "user avatar"}
                          className={styles.submissionAvatar}
                        />
                      )}
                      <span className={styles.submissionUserName}>
                        {displayName}
                      </span>
                    </div>

                    <div className={styles.submissionButtons}>
                      <button
                        type="button"
                        className={
                          isSelected(sub._id, 1)
                            ? `${styles.placeButton} ${styles.placeButtonSelected} ${styles.place1}`
                            : `${styles.placeButton} ${styles.place1}`
                        }
                        onClick={() => selectPlace(sub, 1)}
                      >
                        מקום 1
                      </button>
                      <button
                        type="button"
                        className={
                          isSelected(sub._id, 2)
                            ? `${styles.placeButton} ${styles.placeButtonSelected} ${styles.place2}`
                            : `${styles.placeButton} ${styles.place2}`
                        }
                        onClick={() => selectPlace(sub, 2)}
                      >
                        מקום 2
                      </button>
                      <button
                        type="button"
                        className={
                          isSelected(sub._id, 3)
                            ? `${styles.placeButton} ${styles.placeButtonSelected} ${styles.place3}`
                            : `${styles.placeButton} ${styles.place3}`
                        }
                        onClick={() => selectPlace(sub, 3)}
                      >
                        מקום 3
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={winnersMutation.isPending}
          >
            ביטול
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={winnersMutation.isPending || winners.length === 0}
          >
            {winnersMutation.isPending
              ? "שומרת ומפרסמת…"
              : "שמור זוכים ופרסום"}
          </button>
        </div>

        {winnersMutation.error && (
          <div className={styles.errorText}>
            {(winnersMutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}
