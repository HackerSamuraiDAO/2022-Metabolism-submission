import "videojs-contrib-hls";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.min.css";

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalContent,
  ModalOverlay,
  Stack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { Client, isSupported } from "@livepeer/webrtmp-sdk";
import axios from "axios";
import React from "react";
import videojs from "video.js";

import { Mode } from "../../types/livepeer";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";
import { icons } from "./data";

//TODO: make component for livepeer
export const Main: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>("select");
  const [isStreamingIsActive, setIsStreamingIsActive] = React.useState(false);
  const [videoElement, setVideoElelent] = React.useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [playbackId, setPlaybackId] = React.useState("");
  const [apiKey, setAPIKey] = React.useState("");

  React.useEffect(() => {
    if (!videoElement || !isStreamingIsActive || !playbackId) {
      return;
    }
    const player = videojs(videoElement, {
      autoplay: true,
      controls: true,
      sources: [
        {
          src: `https://cdn.livepeer.com/hls/${playbackId}/index.m3u8`,
        },
      ],
    });
    // TODO: enable it
    // player.hlsQualitySelector();
    player.on("error", () => {
      player.src(`https://cdn.livepeer.com/hls/${playbackId}/index.m3u8`);
    });
  }, [videoElement, isStreamingIsActive, playbackId]);

  //TODO: better type
  const onVideo = React.useCallback((element: any) => {
    setVideoElelent(element);
  }, []);

  const handleAPIKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAPIKey(e.target.value);
  };

  const openStreamingModal = () => {
    setIsStreamingIsActive(true);
    onOpen();
  };

  const closeStreamingModal = () => {
    setIsStreamingIsActive(false);
    onClose();
  };

  const startStreaming = async () => {
    if (!isSupported()) {
      alert("webrtmp-sdk is not currently supported on this browser");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const { data } = await axios.post(
      "api/stream",
      {},
      {
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const { streamKey, playbackId } = data;
    setPlaybackId(playbackId);

    const client = new Client();
    const session = client.cast(stream, streamKey);

    session.on("open", () => {
      openStreamingModal();
      console.log("Stream started.");
    });
    session.on("close", () => {
      closeStreamingModal();
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
                {!isStreamingIsActive && (
                  <FormControl>
                    <FormLabel>Livepeer API Key</FormLabel>
                    <Input type="text" onChange={handleAPIKeyChange} />
                  </FormControl>
                )}

                {isStreamingIsActive && (
                  <Modal onClose={closeStreamingModal} isOpen={isOpen}>
                    <ModalOverlay />
                    <ModalContent position="relative">
                      <div data-vjs-player>
                        <video
                          id="video"
                          ref={onVideo}
                          className="video-js vjs-fluid "
                          controls
                          playsInline
                        />
                      </div>
                      <Box position="absolute" right="2" top="2">
                        {icons.map((icon) => (
                          <IconButton
                            size="xs"
                            key={icon.key}
                            as="a"
                            href={icon.href}
                            target="_blank"
                            aria-label={icon.key}
                            icon={icon.icon}
                          />
                        ))}
                      </Box>
                    </ModalContent>
                  </Modal>
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
