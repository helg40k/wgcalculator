import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

// internal function to get the app version
const version = (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const filePath = path.join(process.cwd(), "version.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(fileContents);

    res.status(200).json({ version: json.version });
  } catch (error) {
    console.error("Cannot read version.json:", error);
    res.status(500).json({ error: "Cannot read version.json" });
  }
};

export default version;
