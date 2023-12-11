/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NFT_MARKET_CONTRACT_ADDRESS:"0x001A5C24F98bC9850CeF398f33F54eF46e0F49fA",
    NFT_CONTRACT_ADDRESS:"0x1Dbb778CEe902519cF9026a801B1F59393bad81C",
    CHAIN_ID:9000
  },
  reactStrictMode: true,
  strictMode: true,
  images: {
    domains: ['ipfs.infura.io'],
  },
}

module.exports = nextConfig
