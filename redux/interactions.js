import { quais } from "quais";
import { ethers } from "ethers";
import * as actions from "./actions"
import NFTMarketContract from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"
import NFTContract from "../artifacts/contracts/NFT.sol/NFT.json"
import axios from "axios";

var marketPlaceAddress = process.env.NFT_MARKET_CONTRACT_ADDRESS
var nftAddress = process.env.NFT_CONTRACT_ADDRESS

export const formatNFTData = async(data,nftContract) =>{
  const tokenUri = await nftContract.tokenURI(data.token)
  const meta = await axios.get(tokenUri)

  const formattedData = {
    name:meta.data.name,
    image:meta.data.image,
    desc:meta.data.description,
    price:weiToEther(data.price),
    token:(data.token).toString(),
    creator:data.creator,
    attributes:meta.data.attributes
  }

  return formattedData;

}

export const weiToEther = (num) =>{
    return quais.utils.formatEther(num)
}

export const etherToWei = (n) => {
  const weiBigNumber = quais.utils.parseEther(n.toString());
  const wei = weiBigNumber.toString();
  return wei
}

export const loadWeb3 = async (dispatch) => {
  if (window.ethereum) {
    try {
      console.log("Initializing provider...");
      const provider = new quais.providers.Web3Provider(window.ethereum, "any");
      await dispatch(actions.web3Loaded(provider));
      
      // Now call getAccounts after the provider is loaded and dispatched
      await getAccounts(dispatch);
      
      return provider;
    } catch (error) {
      console.error("Failed to load Web3:", error);
    }
  } else {
    console.error("Ethereum object not found");
  }
}

const getAccounts = async (dispatch) => {

  console.log('quai_accounts...')
  try {
    await window.ethereum
      .request({ method: 'quai_accounts' })
      .then(async (accounts) => {
        if (accounts.length !== 0) {
          dispatch(actions.walletAddressLoaded(accounts[0]));
        }
      })
      .catch((err) => {
        console.error(err)
      })
  } catch (err) {
    console.error(err)
  }
}
  
  export const loadContracts = async(provider,dispatch) =>{

    const { chainId } = await provider.getNetwork()
    if(chainId !== process.env.CHAIN_ID){
      return {
        marketplace:null,
        nft:null
      }
    }

    var signer ;
    const addresses = await provider.listAccounts(); 
    if (addresses.length > 0) {
      signer = provider.getSigner()
    }else{
      signer = provider
    }
    const nftMarketplaceContract = new quais.Contract(marketPlaceAddress, NFTMarketContract.abi, signer);
    const nftContract = new quais.Contract(nftAddress, NFTContract.abi, signer);

    dispatch(actions.nftMarketplaceContractLoaded(nftMarketplaceContract))
    dispatch(actions.nftContractLoaded(nftContract))
    
    return {
        marketplace:nftMarketplaceContract,
        nft:nftContract
    }

  }

  export const loadAccount = async(provider,dispatch) =>{
    console.log("in load account")
    if (!provider) {
      console.log("no provider")
      return
    }
    const signer = await provider.getSigner();
    const connectedWallet = await signer.getAddress();
    console.log("connectedWallet", connectedWallet)
    dispatch(actions.walletAddressLoaded(connectedWallet))
  }

  export const loadUnsoldNFT = async(provider,marketplaceContract,nftContract,dispatch)=>{

    const { chainId } = await provider.getNetwork()
    if(chainId !== process.env.CHAIN_ID){
      dispatch(actions.unsoldNFTLoaded([]))
      return 
    }

    var unsoldNft = await marketplaceContract.fetchMarketItems()
    console.log("unsoldNft", unsoldNft)
    const formattedNFTList = await Promise.all(unsoldNft.map(nft=>{
      var res = formatNFTData(nft,nftContract)
      return res;
    }))

    dispatch(actions.unsoldNFTLoaded(formattedNFTList))
  }

  export const loadMintedNFT = async(provider,marketplaceContract,account,nftContract,dispatch)=>{

    const { chainId } = await provider.getNetwork()
    if(!account || chainId !== process.env.CHAIN_ID){
      dispatch(actions.mintedNFTLoaded([]))
      return
    }
    var unsoldNft = await marketplaceContract.fetchCreatorItemsListed()
    
    const formattedNFTList = await Promise.all(unsoldNft.map(nft=>{
      var res = formatNFTData(nft,nftContract)
      return res;
    }))

    console.log("mintedNFTs", formattedNFTList)

    dispatch(actions.mintedNFTLoaded(formattedNFTList))
  }

  export const loadOwnedNFT = async(provider,marketplaceContract,account,nftContract,dispatch)=>{
    
    const { chainId } = await provider.getNetwork()
    if(!account || chainId !== process.env.CHAIN_ID){
      dispatch(actions.ownedNFTLoaded([]))
      return 
    }
    var unsoldNft = await marketplaceContract.fetchOwnerItemsListed()
    
    const formattedNFTList = await Promise.all(unsoldNft.map(nft=>{
      var res = formatNFTData(nft,nftContract)
      return res;
    }))

    dispatch(actions.ownedNFTLoaded(formattedNFTList))
  }


  export const buyNFT = async(marketplaceContract,account,tokenId,price,dispatch,onSuccess,onError) =>{
    if(!account){
      return
    }
    try {
      var res = await marketplaceContract.buyItem(tokenId,{value:etherToWei(price)})
      const receipt = await res.wait();
      onSuccess()
      dispatch(actions.nftPurchased(tokenId))
      console.log(receipt)
    } catch (error) {
      onError(error.message)
    }
  }