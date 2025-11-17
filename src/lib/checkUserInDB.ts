export async function checkUserInDB(email: string): Promise<boolean> {
  try {
    console.log("Checking if user exists in DB for email:", email);

    const res = await fetch(`/api/users/check?email=${encodeURIComponent(email)}`);
    console.log("API response status:", res.status);

    if (!res.ok) {
      console.warn("API call failed with status:", res.status);
      return false;
    }

    const data = await res.json();
    console.log("API response data:", data);

    return data.exists;
  } catch (err) {
    console.error("Error checking user in DB:", err);
    return false;
  }
}
