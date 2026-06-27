import { NextApiRequest, NextApiResponse } from "next";

import { auth } from "@/auth";
import getDocumentById from "@/components/firestore/getDocumentById";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth(req, res);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await getDocumentById("tests", "RbuKnGM87660UTdVV9bq");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
