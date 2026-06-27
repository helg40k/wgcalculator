import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export const GET = () => {
  try {
    const filePath = path.join(process.cwd(), "package.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(fileContents);

    return NextResponse.json({ version: json.version });
  } catch (error) {
    console.error("Cannot read package.json:", error);
    return NextResponse.json({ error: "Cannot read version" }, { status: 500 });
  }
};
