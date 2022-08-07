import "videojs-contrib-hls";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.min.css";

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { videonft } from "@livepeer/video-nft";
import { Client, isSupported } from "@livepeer/webrtmp-sdk";
import axios from "axios";
import React from "react";
import videojs from "video.js";
import { useSigner } from "wagmi";

import { API_KEY_BACKEND, API_KEY_FRONTEND } from "../../lib/app/constants";
import { Mode } from "../../types/livepeer";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";

//TODO: make component for livepeer
export const Main: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>("select");
  const [isStreamingIsActive, setIsStreamingIsActive] = React.useState(false);
  const [videoElement, setVideoElelent] = React.useState(null);

  const [playbackId, setPlaybackId] = React.useState("");

  const [assetIdList, setAssetIdList] = React.useState<string[]>([]);

  const { data: signer } = useSigner();

  const [session, setSesstion] = React.useState<any>();

  React.useEffect(() => {
    if (!videoElement || !isStreamingIsActive || !playbackId) {
      return;
    }

    const player = videojs(videoElement, {
      autoplay: true,
      controls: true,
      sources: [
        {
          src: `https://livepeercdn.com/hls/${playbackId}/index.m3u8`,
        },
      ],
    });
    player.on("error", () => {
      player.src(`https://livepeercdn.com/hls/${playbackId}/index.m3u8`);
    });
  }, [videoElement, isStreamingIsActive, playbackId]);

  //TODO: better type
  const onVideo = React.useCallback((element: any) => {
    setVideoElelent(element);
  }, []);

  const closeStreaming = () => {
    if (!session) {
      return;
    }
    session.close();
    setIsStreamingIsActive(false);
  };

  const startStreaming = async () => {
    if (!isSupported()) {
      alert("webrtmp-sdk is not currently supported on this browser");
    }

    if (!signer) {
      return;
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
          authorization: `Bearer ${API_KEY_BACKEND}`,
        },
      }
    );

    const { streamKey, playbackId } = data;
    setPlaybackId(playbackId);

    const client = new Client();
    const session = client.cast(stream, streamKey);
    setSesstion(session);
    session.on("open", () => {
      setIsStreamingIsActive(true);
      console.log("Stream started.");
    });
    session.on("close", () => {
      closeStreaming();
      console.log("Stream stopped.");
    });
    session.on("error", (err) => {
      console.log("Stream error.", err.message);
    });
    console.log("start streaming");
  };

  const getAssets = async () => {
    const assetsResponse = await axios.get("api/asset", {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY_BACKEND}`,
      },
    });

    const assetIdList = Object.values(assetsResponse.data).map((asset: any) => {
      return asset.id as string;
    });
    setAssetIdList(assetIdList);
  };

  const mintNFT = async (assetId: string) => {
    const assetResponse = await axios.get(`api/asset/${assetId}`, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY_BACKEND}`,
      },
    });

    const apiOpts = {
      auth: { apiKey: API_KEY_FRONTEND },
      endpoint: videonft.api.prodApiEndpoint,
    };
    const minter = new videonft.minter.FullMinter(apiOpts, {
      // TODO: better to use wagmi provider
      ethereum: window.ethereum as any,
      chainId: 80001,
    });
    const asset = await minter.api.nftNormalize(assetResponse.data);
    const nftMetadata = {
      description: "My NFT description",
      traits: { "my-custom-trait": "my-custom-value" },
    };
    const ipfs = await minter.api.exportToIPFS(asset.id, nftMetadata);
    const tx = await minter.web3.mintNft(ipfs.nftMetadataUrl);
    const nftInfo = await minter.web3.getMintedNftInfo(tx);
    console.log(
      `minted NFT on contract ${nftInfo.contractAddress} with ID ${nftInfo.tokenId}`
    );
  };

  return (
    <Box
      boxShadow={useColorModeValue("md", "md-dark")}
      borderRadius="2xl"
      px="4"
      py="8"
    >
      <Box>
        {mode === "select" && (
          <Stack spacing="4">
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
                setMode("manage");
              }}
            >
              Manage Streaming
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
          <Stack spacing="4">
            <ConnectWalletWrapper>
              <Stack spacing="4">
                {isStreamingIsActive && (
                  <>
                    <Box>
                      <div data-vjs-player>
                        <video
                          id="video"
                          ref={onVideo}
                          className="video-js vjs-fluid "
                          controls
                          playsInline
                        />
                      </div>
                    </Box>
                    <Button w="full" onClick={closeStreaming}>
                      End
                    </Button>
                  </>
                )}

                {!isStreamingIsActive && (
                  <Button w="full" onClick={startStreaming}>
                    Start
                  </Button>
                )}
              </Stack>
            </ConnectWalletWrapper>
          </Stack>
        )}
        {mode == "manage" && (
          <Stack spacing="4">
            <Button w="full" onClick={getAssets}>
              Get Assets
            </Button>
            {assetIdList.map((assetId) => {
              return (
                <Button
                  fontSize={"xs"}
                  key={assetId}
                  onClick={() => mintNFT(assetId)}
                >
                  {assetId}
                </Button>
              );
            })}
          </Stack>
        )}
        {mode == "view" && (
          <Stack spacing="4">
            <Button w="full">View</Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};
