export const runtime = "nodejs";

import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import type { NextRequest } from "next/server";

export async function GET() {
  await dbConnect();
  const users = await User.find();
  return Response.json(users);
}

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const data = await req.json();
    const {
      firebase_uid,
      name,
      email,
      username,
      avatar_url,
      bio,
      location,
    } = data;

    if (!firebase_uid || !name || !email || !username) {
      return Response.json(
        { message: "firebase_uid, name, email and username are required" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { firebase_uid },
      {
        firebase_uid,
        name,
        email,
        username,
        avatar_url,
        bio,
        location,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return Response.json(user, { status: 201 });
  } catch (err: any) {
    return Response.json({ message: err.message }, { status: 500 });
  }
}
