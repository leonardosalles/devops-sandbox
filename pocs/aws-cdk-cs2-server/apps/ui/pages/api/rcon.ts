import type { NextApiRequest, NextApiResponse } from "next";
import { Rcon } from "rcon-client";

const rconConnections: Map<string, Rcon> = new Map();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { ip, password, command } = req.body;

  if (!ip || !password || !command) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    let rconConnection = rconConnections.get(ip);
    if (!rconConnection) {
      rconConnection = await Rcon.connect({ host: ip, port: 27015, password });
      rconConnections.set(ip, rconConnection);
    }
    const response = await rconConnection.send(command);
    res.status(200).json({ response });

    if (command === "disconnect") {
      await rconConnection.end();
      rconConnections.delete(ip);
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to execute Rcon command",
      error: error.message,
    });
  }
}
