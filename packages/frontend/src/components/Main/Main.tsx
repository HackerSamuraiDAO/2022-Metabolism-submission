import "videojs-contrib-hls";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.min.css";

import { Box, Button, Stack, useColorModeValue } from "@chakra-ui/react";
import { Client, isSupported } from "@livepeer/webrtmp-sdk";
import React from "react";
import videojs from "video.js";

import { Mode } from "../../types/livepeer";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";

//TODO: use generated one
const API_KEY = "";
const STREAM_KEY = "";
const PLAYBACK_ID = "";

//TODO: make component for livepeer
export const Main: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>("select");
  const [isStreamingIsActive, setIsStreamingIsActive] = React.useState(false);
  const [videoElement, setVideoElelent] = React.useState(null);

  //TODO: better type
  const onVideo = React.useCallback((element: any) => {
    setVideoElelent(element);
  }, []);

  React.useEffect(() => {
    if (!videoElement || !isStreamingIsActive) {
      return;
    }
    const player = videojs(videoElement, {
      autoplay: true,
      controls: true,
      sources: [
        {
          src: `https://cdn.livepeer.com/hls/${PLAYBACK_ID}/index.m3u8`,
        },
      ],
    });
    // TODO: enable it
    // player.hlsQualitySelector();
    player.on("error", () => {
      player.src(`https://cdn.livepeer.com/hls/${PLAYBACK_ID}/index.m3u8`);
    });
  }, [videoElement, isStreamingIsActive]);

  const startStreaming = async () => {
    if (!isSupported()) {
      alert("webrtmp-sdk is not currently supported on this browser");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const client = new Client();
    const session = client.cast(stream, STREAM_KEY);
    session.on("open", () => {
      setIsStreamingIsActive(true);
      console.log("Stream started.");
    });
    session.on("close", () => {
      setIsStreamingIsActive(false);
      console.log("Stream stopped.");
    });
    session.on("error", (err) => {
      console.log("Stream error.", err.message);
    });
    console.log("start streaming");
  };

  return (
    <Box
      boxShadow={useColorModeValue("md", "md-dark")}
      borderRadius="2xl"
      p="8"
    >
      <Box>
        {mode === "select" && (
          <Stack>
            <Button
              w="full"
              onClick={() => {
                setMode("create");
              }}
            >
              Create Streaming
            </Button>
            <Button
              w="full"
              onClick={() => {
                setMode("view");
              }}
            >
              View Streaming
            </Button>
          </Stack>
        )}
        {mode == "create" && (
          <Stack>
            <ConnectWalletWrapper>
              <Stack>
                {isStreamingIsActive && (
                  <div data-vjs-player>
                    <video
                      id="video"
                      ref={onVideo}
                      className="h-full w-full video-js vjs-fluid vjs-16-9 vjs-theme-city"
                      controls
                      playsInline
                    />
                  </div>
                )}
                <Button w="full" onClick={startStreaming}>
                  Start
                </Button>
              </Stack>
            </ConnectWalletWrapper>
          </Stack>
        )}
        {mode == "view" && (
          <Stack>
            <Button w="full">View</Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};
