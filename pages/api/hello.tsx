import { NextApiRequest, NextApiResponse } from "next";

// internal function to test API
// http://localhost:3000/api/hello
const hello = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ message: `Hello, world!` });
};

export default hello;
