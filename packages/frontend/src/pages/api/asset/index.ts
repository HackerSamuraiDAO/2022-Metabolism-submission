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

    try {
      const assetResponse = await axios.get(
        "https://livepeer.studio/api/asset",
        {
          headers: {
            authorization,
          },
        }
      );

      if (assetResponse && assetResponse.data) {
        res.statusCode = 200;
        res.json({ ...assetResponse.data });
      } else {
        res.statusCode = 500;
        res.json({ error: "Something went wrong" });
      }
    } catch (error) {
      console.log(error);
      res.statusCode = 500;
      res.json({ error });
    }
  }
};

export default hander;
