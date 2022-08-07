import "videojs-contrib-hls";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.min.css";

import {
  Box,
  Button,
  Link,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//TODO: make component for livepeer
export const Main: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>("select");
  const [status, setStatus] = React.useState<
    | "none"
    | "waitForCreation"
    | "createNFTMetadata"
    | "mintNFT"
    | "waitTxConfirm"
    | "sellNFT"
    | "complete"
  >("none");
  const [isStreamingIsActive, setIsStreamingIsActive] = React.useState(false);
  const [videoElement, setVideoElelent] = React.useState(null);

  const [playbackId, setPlaybackId] = React.useState("");
  const { data: signer } = useSigner();

  const [session, setSesstion] = React.useState<any>();
  const [player, setPlayer] = React.useState<any>();

  const [hash, setHash] = React.useState("");

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
    }) as any;
    player.on("error", () => {
      player.src(`https://livepeercdn.com/hls/${playbackId}/index.m3u8`);
    });
    player.hlsQualitySelector();
    setPlayer(player);
  }, [videoElement, isStreamingIsActive, playbackId]);

  //TODO: better type
  const onVideo = React.useCallback((element: any) => {
    setVideoElelent(element);
  }, []);

  const closeStreaming = () => {
    if (!player || !session) {
      return;
    }
    session.close();
    player.dispose();
    setIsStreamingIsActive(false);
  };

  const startStreaming = async () => {
    if (!isSupported()) {
      alert("webrtmp-sdk is not currently supported on this browser");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("create stream");
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
    console.log(data);
    setPlaybackId(playbackId);
    const client = new Client();
    const session = client.cast(stream, streamKey);
    setSesstion(session);

    session.on("open", () => {
      setIsStreamingIsActive(true);
      setMode("create");
      console.log("Stream started.");
    });
    session.on("close", async () => {
      console.log("Stream stopped.");
      setMode("mint");
      closeStreaming();
      await mintNFT();
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
    return assetIdList;
  };

  const mintNFT = async () => {
    setStatus("none");
    if (!signer) {
      return;
    }

    console.log("--- livepeer process ---");
    console.log("waiting streaming record creation...");
    setStatus("waitForCreation");
    // const initialAssets = await getAssets();
    const createdAssetId = await new Promise((resolve) => {
      const interval = setInterval(async () => {
        console.log("waiting...");
        const currentAsset = await getAssets();
        // TODO: for demo we use last created record, remove this, because it is too slow, but I checked this is working fine in dev
        // if (currentAsset.length > initialAssets.length) {
        clearInterval(interval);
        resolve(currentAsset[0]);
        // }
      }, 5000);
    });

    console.log("record created:", createdAssetId);
    setStatus("createNFTMetadata");

    const assetResponse = (await new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const assetResponseTemp = await axios.get(
            `api/asset/${createdAssetId}`,
            {
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${API_KEY_BACKEND}`,
              },
            }
          );
          if (assetResponseTemp) {
            clearInterval(interval);
            resolve(assetResponseTemp);
          }
        } catch (e) {
          console.log("retry to fetch data");
        }
      }, 5000);
    })) as any;

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
    console.log("normalize asset for nft...");
    const asset = await minter.api.nftNormalize(assetResponse.data);
    console.log(asset);
    const nftMetadata = {
      description: "My NFT description",
      traits: { "my-custom-trait": "my-custom-value" },
    };
    console.log("uploading to ipfs...");
    const ipfs = await minter.api.exportToIPFS(asset.id, nftMetadata);
    console.log(ipfs);
    setStatus("mintNFT");
    console.log("minting nft...");
    const tx = await minter.web3.mintNft(ipfs.nftMetadataUrl);
    console.log(tx);
    setStatus("waitTxConfirm");
    console.log("waiting tx confirmation...");

    await tx.wait();
    console.log("tx confirmed");
    setStatus("sellNFT");
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
    const result = await askModuleContract.createAsk(
      contractAddress,
      tokenId,
      askPrice,
      "0x0000000000000000000000000000000000000000", // 0 address for ETH sale
      ownerAddress,
      findersFeeBps
    );
    setStatus("complete");
    setHash(result.hash);
    console.log(result);
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
                startStreaming();
              }}
            >
              Create Streaming 🎥
            </Button>
          </Stack>
        )}
        {mode == "create" && (
          <Stack spacing="4">
            <Stack spacing="4">
              {isStreamingIsActive && (
                <>
                  <Box>
                    <div data-vjs-player>
                      <video
                        id="video"
                        ref={onVideo}
                        className="video-js vjs-fluid"
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
            </Stack>
          </Stack>
        )}
        {mode == "mint" && (
          <Stack>
            <Text align={"center"} fontWeight="bold" fontSize={"xl"} mb="4">
              Arctic Arcive 🏔
            </Text>
            <ConnectWalletWrapper>
              {status === "waitForCreation" && (
                <>
                  <Text align={"center"} fontWeight="bold">
                    Creating Streaming Record
                  </Text>
                  <Text align={"center"} fontSize={"sm"}>
                    This is using Livepeer. It will take some time.
                  </Text>
                </>
              )}
              {status === "createNFTMetadata" && (
                <>
                  <Text align={"center"} fontWeight="bold">
                    Creating NFT Metadata
                  </Text>
                  <Text align={"center"} fontSize={"sm"}>
                    This is using IPFS. It will take some time.
                  </Text>
                </>
              )}
              {status === "mintNFT" && (
                <>
                  <Text align={"center"} fontWeight="bold">
                    Minting Arctic Live Video NFT
                  </Text>
                  <Text align={"center"} fontSize={"sm"}>
                    This is using Metamask and Livepeer. Please confirm tx.
                  </Text>
                </>
              )}
              {status === "waitTxConfirm" && (
                <>
                  <Text align={"center"} fontWeight="bold">
                    Waiting Tx Confirmation
                  </Text>
                  <Text align={"center"} fontSize={"sm"}>
                    This is in Polygon Mumbai. It will take some time.
                  </Text>
                </>
              )}
              {status === "sellNFT" && (
                <>
                  <Text align={"center"} fontWeight="bold">
                    Finding Supporter
                  </Text>
                  <Text align={"center"} fontSize={"sm"}>
                    This is using Metamask and Zora V3. Please confirm tx.
                  </Text>
                </>
              )}
              {status === "complete" && (
                <>
                  <Text align={"center"} fontWeight="bold">
                    Completed
                  </Text>
                  <Text align={"center"} fontSize={"sm"}>
                    Congratulation! Your live video is archived in NFT and
                    looking for supporter!{" "}
                    <Link href={`https://mumbai.polygonscan.com/tx/${hash}`}>
                      Check Zora V3 Tx
                    </Link>
                  </Text>
                </>
              )}
            </ConnectWalletWrapper>
          </Stack>
        )}
      </Box>
    </Box>
  );
};
