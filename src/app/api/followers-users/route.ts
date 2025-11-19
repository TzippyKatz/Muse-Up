export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import FollowModel from "../../../models/Follow";

const Follow: any = FollowModel;

/**
 * GET /api/followers-users?userId=AAA
 * מחזיר רשימת משתמשים שעוקבים אחרי userId (כולם לפי firebase_uid).
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); // firebase_uid של מי שמסתכלים עליו

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    // מוצאים את כל מי שעוקב אחרי userId
    const follows = await Follow.find({
      followed_user_id: userId, // שדה מחרוזת ב־Mongo
    }).lean();

    if (!follows.length) {
      return NextResponse.json([], { status: 200 });
    }

    const followerUids = follows.map((f: any) => f.following_user_id);

    // מביאים את פרטי המשתמשים לפי firebase_uid
    const users = await User.find({
      firebase_uid: { $in: followerUids },
    })
      .select("firebase_uid name username avatar_url bio")
      .lean();

    const result = users.map((u: any) => ({
      _id: u.firebase_uid as string, // נשתמש ב-firebase_uid בתור ה-id בצד קליינט
      name: u.name,
      username: u.username,
      avatar_url: u.avatar_url,
      bio: u.bio,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching followers-users", err);
    return NextResponse.json(
      { message: "Failed to fetch followers", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/followers-users
 * body: { userId, followerId }
 * userId     – firebase_uid של המשתמש המחובר (זה שמבצע את הפעולה)
 * followerId – firebase_uid של המשתמש שעליו לוחצים (זה שרוצים לעקוב אחריו)
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const followerId = body?.followerId as string | undefined;

    if (!userId || !followerId) {
      return NextResponse.json(
        { message: "userId and followerId are required" },
        { status: 400 }
      );
    }

    if (userId === followerId) {
      return NextResponse.json(
        { message: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // אם כבר קיים – פשוט נחזיר success
    const existing = await Follow.findOne({
      following_user_id: userId,
      followed_user_id: followerId,
    }).lean();

    if (!existing) {
      await Follow.create({
        following_user_id: userId,
        followed_user_id: followerId,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error following user", err);
    return NextResponse.json(
      { message: "Failed to follow", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/followers-users
 * body: { userId, followerId }
 * מבטל מעקב – מוחק את השורה מ-Follow.
 */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const followerId = body?.followerId as string | undefined;

    if (!userId || !followerId) {
      return NextResponse.json(
        { message: "userId and followerId are required" },
        { status: 400 }
      );
    }

    await Follow.findOneAndDelete({
      following_user_id: userId,
      followed_user_id: followerId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error unfollowing user", err);
    return NextResponse.json(
      { message: "Failed to unfollow", details: err.message },
      { status: 500 }
    );
  }
}
