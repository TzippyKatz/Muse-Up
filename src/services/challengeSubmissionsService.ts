export async function getUserJoinedChallenges(userUid: string) {
  const res = await fetch(
    `/api/challenge-submissions?user_uid=${encodeURIComponent(userUid)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Failed to load user submissions");
  }
  return res.json();
}

export async function joinChallenge(challengeId: number, userUid: string) {
  const res = await fetch("/api/challenge-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId, user_uid: userUid }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to join challenge");
  }
  return data;
}

export async function leaveChallenge(challengeId: number, userUid: string) {
  const res = await fetch("/api/challenge-submissions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId, user_uid: userUid }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to leave challenge");
  }
  return data;
}
