import "videojs-contrib-hls";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.min.css";

import { Box, Button, Stack, useColorModeValue } from "@chakra-ui/react";
import { videonft } from "@livepeer/video-nft";
import { Client, isSupported } from "@livepeer/webrtmp-sdk";
import mumbaiZoraAddresses from "@zoralabs/v3/dist/addresses/80001.json";
import { AsksV1_1__factory } from "@zoralabs/v3/dist/typechain/factories/AsksV1_1__factory";
import { IERC721__factory } from "@zoralabs/v3/dist/typechain/factories/IERC721__factory";
import { ZoraModuleManager__factory } from "@zoralabs/v3/dist/typechain/factories/ZoraModuleManager__factory";
import axios from "axios";
import { ethers } from "ethers";
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
    if (!signer) {
      return;
    }

    console.log("--- livepeer process ---");
    console.log("fetching asset information...");
    const assetResponse = await axios.get(`api/asset/${assetId}`, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY_BACKEND}`,
      },
    });
    console.log(assetResponse.data);
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
    console.log("uploading to ipfs...");
    const ipfs = await minter.api.exportToIPFS(asset.id, nftMetadata);
    console.log(ipfs);
    console.log("minting nft...");
    const tx = await minter.web3.mintNft(ipfs.nftMetadataUrl);
    console.log(tx);
    console.log("waiting tx confirmation...");
    await tx.wait();
    console.log("tx confirmed");
    const nftInfo = await minter.web3.getMintedNftInfo(tx);
    console.log(
      `minted NFT on contract ${nftInfo.contractAddress} with ID ${nftInfo.tokenId}`
    );

    console.log("--- zora v3 process ---");
    console.log("create order...");
    const askModuleContract = AsksV1_1__factory.connect(
      mumbaiZoraAddresses.AsksV1_1,
      signer
    );
    const contractAddress = nftInfo.contractAddress;
    const tokenId = ethers.BigNumber.from(nftInfo.tokenId);
    const askPrice = ethers.utils.parseEther("0.001"); // 100 ETH Sale Price
    const ownerAddress = await signer.getAddress(); // Owner of the assets
    const findersFeeBps = "500"; // 2% Finders Fee (in BPS)

    const erc721Contract = IERC721__factory.connect(contractAddress, signer);
    const erc721TransferHelperAddress =
      mumbaiZoraAddresses.ERC721TransferHelper;

    console.log("check isTransferHelperApproved...");
    const isTransferHelperApproved = await erc721Contract.isApprovedForAll(
      ownerAddress, // NFT owner address
      erc721TransferHelperAddress // V3 Module Transfer Helper to approve
    );

    console.log("isTransferHelperApproved", isTransferHelperApproved);
    if (!isTransferHelperApproved) {
      const approveTransferHelper = await erc721Contract.setApprovalForAll(
        erc721TransferHelperAddress,
        true
      );
      await approveTransferHelper.wait();
    }

    const moduleManagerContract = ZoraModuleManager__factory.connect(
      mumbaiZoraAddresses.ZoraModuleManager,
      signer
    );

    console.log("check isModuleManagerApproved...");
    const isModuleManagerApproved =
      await moduleManagerContract.isModuleApproved(
        ownerAddress,
        mumbaiZoraAddresses.AsksV1_1
      );

    console.log("isModuleManagerApproved", isModuleManagerApproved);

    if (!isModuleManagerApproved) {
      const approveisModuleManager =
        await moduleManagerContract.setApprovalForModule(
          mumbaiZoraAddresses.AsksV1_1,
          true
        );
      await approveisModuleManager.wait();
    }

    console.log("create ask...");
    await askModuleContract.createAsk(
      contractAddress,
      tokenId,
      askPrice,
      "0x0000000000000000000000000000000000000000", // 0 address for ETH sale
      ownerAddress,
      findersFeeBps
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
