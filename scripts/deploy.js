const hre = require("hardhat");
const fs = require('fs');

const quais = require('quais')
const { pollFor } = require('quais-polling')


async function main() {
  const NFTmarket = await hre.ethers.getContractFactory("NFTMarket");
  const quaisProvider = new quais.providers.JsonRpcProvider(hre.network.config.url);
	
  // Configure quai wallet based on hardhat network config
  const walletWithProvider = new quais.Wallet(hre.network.config.accounts[0], quaisProvider)
  
  	// Ensure provider is ready
  await quaisProvider.ready
  
  // Build contract factory using quai provider and wallet
	const QuaiNFTMarket = new quais.ContractFactory(
		NFTmarket.interface.fragments,
		NFTmarket.bytecode,
		walletWithProvider
  )
  
  	// Deploy greeter contract with initial greeting
  const nftmarket = await QuaiNFTMarket.deploy({ gasLimit: 5000000 })
  
  	// Use quais-polling shim to wait for contract to be deployed
	const NFTMarketDeployReceipt = await pollFor(
		quaisProvider, // provider passed to poller
		'getTransactionReceipt', // method to call on provider
		[nftmarket.deployTransaction.hash], // params to pass to method
		1.5, // initial polling interval in seconds
		1 // request timeout in seconds
  )
  
  console.log("NFTmarket contract deployed to:", nftmarket.address);

  const NFT = await hre.ethers.getContractFactory("NFT");

  // // Build contract factory using quai provider and wallet
	const QuaiNFT = new quais.ContractFactory(
		NFT.interface.fragments,
		NFT.bytecode,
		walletWithProvider
  )
  
  const nft = await QuaiNFT.deploy({ gasLimit: 5000000 });

  // Use quais-polling shim to wait for contract to be deployed
  const NFTDeployReceipt = await pollFor(
    quaisProvider, // provider passed to poller
    'getTransactionReceipt', // method to call on provider
    [nft.deployTransaction.hash], // params to pass to method
    1.5, // initial polling interval in seconds
    1 // request timeout in seconds
  )
  console.log("NFT contract deployed to:", nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
