import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
/**
 * calls the /stream route of Livepeer.com APIs to create a new stream.
 * The response returns the playbackId and streamKey.
 * With this data available the ingest and playback urls would respectively be:
 * Ingest URL: rtmp://rtmp.livepeer.com/live/{stream-key}
 * Playback URL: https://cdn.livepeer.com/hls/{playbackId}/index.m3u8
 */
import { v4 } from "uuid";

const hander = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const authorization = req.headers["authorization"] || "";
    const name = v4();
    try {
      const createStreamResponse = await axios.post(
        "https://livepeer.com/api/stream",
        {
          name,
          record: true,
        },
        {
          headers: {
            "content-type": "application/json",
            authorization,
          },
        }
      );
      if (!createStreamResponse || !createStreamResponse.data) {
        res.statusCode = 500;
        res.json({ error: "Something went wrong" });
      } else {
        res.statusCode = 200;
        res.json({ ...createStreamResponse.data });
      }

      // TODO: better typing
    } catch (error: any) {
      res.statusCode = 500;
      // Handles Invalid API key error
      if (error.response.status === 403) {
        res.statusCode = 403;
      }
      res.json({ error });
    }
  }
};

export default hander;
