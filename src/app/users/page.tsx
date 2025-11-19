import { dbConnect } from "../../lib/mongoose";
import UserModel from "../../models/User";
import UsersClient from "./UsersClient";
import styles from "./users.module.css";

export type User = {
  _id: string;
  firebase_uid: string;
  username: string;
  name?: string;
  email: string;
  role: string;
  location?: string;
  bio?: string;
  profil_url?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  created_at?: string;
};

export default async function UsersPage() {
  await dbConnect();

  const usersFromDb = await UserModel.find().lean<any[]>();

  const users: User[] = usersFromDb.map((u) => ({
    _id: u._id.toString(),
    firebase_uid: u.firebase_uid,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    location: u.location,
    bio: u.bio,
    profil_url: u.profil_url,
    avatar_url: u.avatar_url,
    followers_count: u.followers_count ?? 0,
    following_count: u.following_count ?? 0,
    created_at: u.created_at ? u.created_at.toISOString() : undefined,
  }));

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Discover artists</h1>
      <UsersClient initialUsers={users} />
    </main>
  );
}
