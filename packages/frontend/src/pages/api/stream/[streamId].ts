import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
/**
 * calls the /stream/<id> route of Livepeer.com APIs to get the stream's status to verify that the stream is live or not.
 * isActive: true means video segments are currently being ingested by Livepeer.com. isActive: false means the live stream is idle and no
 * video segments are currently being ingested by Livepeer.com.
 */

const hander = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    const authorization = req.headers["authorization"] || "";
    const streamId = req.query.streamId;
    try {
      const streamStatusResponse = await axios.get(
        `https://livepeer.com/api/stream/${streamId}`,
        {
          headers: {
            "content-type": "application/json",
            authorization, // API Key needs to be passed as a header
          },
        }
      );

      if (streamStatusResponse && streamStatusResponse.data) {
        res.statusCode = 200;
        res.json({ ...streamStatusResponse.data });
      } else {
        res.statusCode = 500;
        res.json({ error: "Something went wrong" });
      }
    } catch (error) {
      res.statusCode = 500;
      res.json({ error });
    }
  }
};

export default hander;
