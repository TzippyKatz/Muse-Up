export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import ChallengeSubmission from "../../../models/ChallengeSubmission";
import User from "../../../models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const challengeIdParam = searchParams.get("challengeId");
    const userIdParam = searchParams.get("userId");
    const userUidParam = searchParams.get("user_uid");
    const postIdParam = searchParams.get("postId");

    const filter: any = {};

    if (challengeIdParam) filter.challenge_id = Number(challengeIdParam);
    if (postIdParam) filter.post_id = Number(postIdParam);
    if (userIdParam) {
      filter.user_id = Number(userIdParam);
    } else if (userUidParam) {
      const user = await User.findOne({ firebase_uid: userUidParam }).lean();
      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }
      filter.user_id = user.id;
    }

    const submissions = await (ChallengeSubmission as any)
      .find(filter)
      .lean();

    return NextResponse.json(submissions, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenge-submissions error:", err);
    return NextResponse.json(
      { message: "Failed to fetch submissions", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { challenge_id, user_uid } = body;

    if (!challenge_id || !user_uid) {
      return NextResponse.json(
        { message: "challenge_id and user_uid are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const existing = await (ChallengeSubmission as any)
      .findOne({ challenge_id, user_id: user.id })
      .lean();

    if (existing) {
      return NextResponse.json(
        { message: "Already joined" },
        { status: 200 }
      );
    }

    const last = await (ChallengeSubmission as any)
      .findOne()
      .sort({ id: -1 })
      .lean();
    const nextId = last?.id ? last.id + 1 : 1;

    const doc = await (ChallengeSubmission as any).create({
      id: nextId,
      challenge_id,
      user_id: user.id,
      post_id: null, 
      status: "joined",
    });

    return NextResponse.json(
      { message: "Joined successfully", submission: doc },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("join error:", err);
    return NextResponse.json(
      { message: "Failed to join challenge", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { challenge_id, user_uid } = body;

    if (!challenge_id || !user_uid) {
      return NextResponse.json(
        { message: "challenge_id and user_uid are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const result = await (ChallengeSubmission as any).deleteOne({
      challenge_id,
      user_id: user.id,
    });

    return NextResponse.json(
      {
        message:
          result.deletedCount && result.deletedCount > 0
            ? "Left challenge"
            : "Not joined",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("unjoin error:", err);
    return NextResponse.json(
      { message: "Failed to leave challenge", error: err.message },
      { status: 500 }
    );
  }
}
