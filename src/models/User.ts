import { Schema, model, models, Document, Model } from "mongoose";

// Define the IUser interface extending Document for TypeScript types in route
interface IUser extends Document {
  firebase_uid: string;
  name: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  role: string;
  followers_count: number;
  following_count: number;
  artworks_count: number;
  likes_received: number;
  created_at: Date;
}


const UserSchema = new Schema<IUser>(
  {
    firebase_uid: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    username: { type: String, required: true, unique: true, trim: true },
    avatar_url: String,
    bio: String,
    location: String,
    role: { type: String, default: "user" },
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    artworks_count: { type: Number, default: 0 },
    likes_received: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);

export default User;
