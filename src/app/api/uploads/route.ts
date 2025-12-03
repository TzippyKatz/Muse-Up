// src/app/api/uploads/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function uploadStream(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "museup/posts",
        public_id: `item_${Date.now()}`,
        transformation: [{ fetch_format: "auto", quality: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await uploadStream(buffer);

    // const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    //     const upload = await cloudinary.uploader.upload(dataUri, {
    //       folder: "museup/posts",
    //       public_id: `item_${Date.now()}`,
    //       transformation: [
    //       { fetch_format: "auto", quality: "auto" },
    //       ],
    //     });

    //     return NextResponse.json({ url: upload.secure_url }, { status: 200 });
    //   } catch (err: any) {
    //     return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
    //   }
    // }
    return NextResponse.json({ url: result.secure_url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
