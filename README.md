# 2022-Metabolism-submission

![service](https://user-images.githubusercontent.com/38043569/183307335-a3be111a-cfa2-4ec3-801e-0c39106923e2.png)

![nft](https://user-images.githubusercontent.com/38043569/183308742-6825b0e2-2ce5-461d-b66a-db9836b29776.png)

## Service Name

Arctic Live

## Prize

We got 2nd prize from Livepeer

## Overview

This is a video live streaming platform using Livepeer, and live streaming data is converted to NFT with IPFS, then it can be directly sold in the Zora V3 marketplace.

We call this service as "Arctic Live" because I think we can use NFT with IPFS to archive live streaming data like "GitHub Arctic".

Many creators are using live streaming for their activity, and this Arctic Live enables the creator to have better monetization with fewer and more enthusiastic fans.

Archived data is recorded in Polygon blockchain with a timestamp, so the user can see the activity provenance like Hashmasks.

Reference - Hashmasks Provence
https://www.thehashmasks.com/provenance.html

We are using Zora V3, Livepeer, and Polygon.

Using Zora V3 to enable listing created NFT. This is good for creators to find super fans or supporters for their daily creative activity.

Using Livepeer to stream, record the stream, and covert the record to NFT with IPFS. This is good to build complex streaming services in an easy way.

Using Polygon Mumbai as blockchain. This is good for creating "daily NFT" by a cheaper gas price.

## Tx

- mint archived live streaming NFT using Livepeer

  - https://mumbai.polygonscan.com/tx/0xb6b5ded7664f0377fe3db6d6159f8010dc2f1ea3029ac19077455d8525c70e4d

- create ask in zora v3

  - https://mumbai.polygonscan.com/tx/0xe864e894e448584cef6d6323435a120fcb34b7052aa6bbccf54d77418ab48e29

- created NFT by Livepeer

  - https://testnets.opensea.io/assets/mumbai/0xa4e1d8fe768d471b048f9d73ff90ed8fccc03643/164

## Used Protocols

- Zora V3
- Polygon
- Livepeer
- NFTStorage is possible

## Disclaimer

- Now we are exposing API key because mint NFT requires cors enabled API key, I'll disable this soon.

## Principle

- make it stupid simple
- no monorepo integration for packages, leave it as separated package
- minimum code linting fixing

### Frontend

- No atomic design, just simple components
- Mainly use Chakra UI, use MUI if specific component is required, use tailwind for custom design

## Development

### Frontend

```
cd packages/frontend
yarn dev
```
