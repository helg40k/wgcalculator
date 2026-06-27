import { NextResponse } from "next/server";

import { auth } from "@/auth";
import getDocumentById from "@/components/firestore/getDocumentById";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getDocumentById("tests", "RbuKnGM87660UTdVV9bq");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
