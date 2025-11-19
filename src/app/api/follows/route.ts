export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
 import Follow from "../../../models/Follow";
import User from "../../../models/User";

// GET /api/follows?userId=XXX&type=followers|following
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    if (!userId || !type) {
      return Response.json(
        { message: "userId and type are required" },
        { status: 400 }
      );
    }

    let filter: any = {};

    if (type === "followers") {
      // מי שעוקבים אחרי המשתמש הזה
      filter = { followed_user_id: userId };
    } else if (type === "following") {
      // אחרי מי המשתמש הזה עוקב
      filter = { following_user_id: userId };
    } else {
      return Response.json(
        { message: "Invalid type. Use 'followers' or 'following'" },
        { status: 400 }
      );
    }

    const follows = await Follow.find(filter).lean();

    return Response.json(follows, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/follows error", err);
    return Response.json(
      {
        message: "Failed to fetch follows",
        details: err?.message ?? "Server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/follows
// body: { following_user_id, followed_user_id }  (שניהם firebase_uid)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { following_user_id, followed_user_id } = body as {
      following_user_id?: string;
      followed_user_id?: string;
    };

    if (!following_user_id || !followed_user_id) {
      return Response.json(
        { message: "following_user_id and followed_user_id are required" },
        { status: 400 }
      );
    }

    if (following_user_id === followed_user_id) {
      return Response.json(
        { message: "User cannot follow themselves" },
        { status: 400 }
      );
    }

    // לבדוק אם כבר יש רשומת Follow כזו – שלא נעשה כפולים
   const existing = await Follow.findOne({
  following_user_id,
  followed_user_id,
});

if (existing) {
  return Response.json({ isFollowing: true, alreadyExisted: true });
}

// פה באמת ליצור רשומה בטבלת Follow
await Follow.create({
  following_user_id,
  followed_user_id,
});


    // לעדכן מונים ב-User לפי firebase_uid
    await User.updateOne(
      { firebase_uid: followed_user_id },
      { $inc: { followers_count: 1 } }
    );

    await User.updateOne(
      { firebase_uid: following_user_id },
      { $inc: { following_count: 1 } }
    );

    return Response.json({ isFollowing: true }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/follows error", err);
    return Response.json(
      {
        message: "Failed to create follow",
        details: err?.message ?? "Server error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/follows
// body: { following_user_id, followed_user_id }
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { following_user_id, followed_user_id } = body as {
      following_user_id?: string;
      followed_user_id?: string;
    };

    if (!following_user_id || !followed_user_id) {
      return Response.json(
        { message: "following_user_id and followed_user_id are required" },
        { status: 400 }
      );
    }

    // מוחקים את רשומת ה-Follow
    const deleted = await Follow.findOneAndDelete({
      following_user_id,
      followed_user_id,
    });

    if (!deleted) {
      // לא הייתה רשומה – אין מה לעדכן
      return Response.json(
        { message: "Follow not found", isFollowing: false },
        { status: 404 }
      );
    }

    // לעדכן מונים ב-User רק אם באמת היה Follow
    await User.updateOne(
      { firebase_uid: followed_user_id },
      { $inc: { followers_count: -1 } }
    );

    await User.updateOne(
      { firebase_uid: following_user_id },
      { $inc: { following_count: -1 } }
    );

    return Response.json({ isFollowing: false }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/follows error", err);
    return Response.json(
      {
        message: "Failed to delete follow",
        details: err?.message ?? "Server error",
      },
      { status: 500 }
    );
  }
}
