import { NextResponse } from "next/server";
import { parseCV } from "@/lib/cv-parser";
import type { ParsedCV } from "@/lib/types";

function checkAuth(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET || "password123";
  const authHeader = request.headers.get("authorization");
  
  if (authHeader === `Bearer ${adminSecret}`) {
    return true;
  }
  
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );
  
  return cookies["admin_token"] === adminSecret;
}

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedCV: ParsedCV = await parseCV(buffer, file.type);

    return NextResponse.json(parsedCV);
  } catch (error) {
    console.error("Error parsing CV:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse CV" },
      { status: 500 }
    );
  }
}
