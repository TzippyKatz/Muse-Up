export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../../lib/mongoose";
import ChallengeSubmission from "../../../../../models/ChallengeSubmission";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    // סופרים כמה רשומות יש לאתגר הזה
    const count = await (ChallengeSubmission as any).countDocuments({
      challenge_id: numericId,
    });

    return NextResponse.json(
      {
        challenge_id: numericId,
        count,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(
      "GET /api/challenges/[id]/participants error:",
      err
    );
    return NextResponse.json(
      { message: "Failed to fetch participants count", details: err.message },
      { status: 500 }
    );
  }
}
