# 2022-Metabolism-submission

## Service Name

Arctic Live

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
