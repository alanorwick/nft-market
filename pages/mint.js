import React, { useRef, useState } from "react";
import { basicAuth } from "../helpers/AuthHelper";
import { toast } from 'react-toastify';
import { create } from "ipfs-http-client";
import { createHelia } from 'helia'
import { useDispatch, useSelector } from "react-redux";
import { etherToWei, formatNFTData } from "../redux/interactions";
import { useRouter } from "next/router";
import { nftMinted } from "../redux/actions";
import { unixfs } from '@helia/unixfs'

const Mint = () => {
  const router = useRouter()
  const formRef = useRef(null);
  const dispatch = useDispatch()
  const [file, setFile] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState(null);
  const [loader, setLoader] = useState(false);

  const walletAddress = useSelector(state=>state.web3Reducer.account)
  const nftReducer = useSelector(state=>state.nftReducer.contract)
  const nftMarketplaceReducer = useSelector(state=>state.nftMarketplaceReducer.contract)
  const provider = useSelector(state => state.web3Reducer.connection);

  const addAttribute = (e) => {
    e.preventDefault();
    if (attributes) {
      var attr = [
        ...attributes,
        {
          id: attributes.length,
          trait_type: e.target.key.value,
          value: e.target.value.value,
        },
      ];
      setAttributes(attr)
    } else {
      setAttributes([
        { id: 0, trait_type: e.target.key.value, value: e.target.value.value },
      ]);
    }
    formRef.current.reset();
  };

  const removeAttribute = (id) => {
    var filteredAttr = attributes.filter((data) => data.id !== id);
    setAttributes(filteredAttr);
  };

  const uploadImageToIPFS = async()=> {

    const { chainId } = await provider.getNetwork()
    if(chainId !== process.env.CHAIN_ID){
      toast.error('Invalid chain Id ! Please use ropsten test network :)', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
      return 
    }

    setLoader(true)
    if (!name || !description || !price || !file) {
      toast.error("Please fill all the required fields !", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
    };

    try {
      const hash = await uploadFile(file)
      let url = process.env.NEXT_PUBLIC_GATEWAY_URL + hash
      console.log("url 1", url)
      await uploadMetadataToIPFS(url)
    } catch (error) {
      setLoader(false)
      toast.error("Image upload failed !", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
      console.log('Error uploading file: ', error)
    }
  }


  const uploadFile = async (fileToUpload) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload, { filename: fileToUpload.name });
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      setUploading(false);
      return ipfsHash;
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const uploadJson = async (data) => {
    try {
      setUploading(true);
      const res = await fetch("/api/json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });
      const ipfsHash = await res.text();
      setUploading(false);
      return ipfsHash;
    }
    catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  }

  const uploadMetadataToIPFS = async(fileUrl) => {
    if (!name || !description || !price || !fileUrl) return;
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name: name,
      description: description,
      image: fileUrl,
      attributes: attributes
    });

    try {
      console.log("data", data)
      const hash = await uploadJson(data)
      console.log("json hash", hash)
      let url = process.env.NEXT_PUBLIC_GATEWAY_URL + hash

      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      await mintNFT(url)
      
      return url;
    } catch (error) {
      setLoader(false)
      toast.error("Meta data upload failed !", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
      console.log("Error uploading file: ", error);
    }
  }

  const mintNFT = async(metadata) =>{
    try {
      
      const tx = await nftMarketplaceReducer.sellItem(metadata,etherToWei(price),nftReducer.address,{from:walletAddress,value:etherToWei("0.0001")})
      const receipt = await tx.wait();
      const formattedData =  await formatNFTData(receipt.events[4].args,nftReducer)
      console.log("NFT metadata : ",formattedData)
      dispatch(nftMinted(formattedData))

      setFile("")
      setName("")
      setPrice("")
      setDescription("")
      setAttributes("")

      toast.success("NFT minted successfully 🎉", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
        router.push("/creator-profile")
      setLoader(false)
    } catch (error) {
      setLoader(false)
      toast.error(error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });

    }
  }

  return (
    <div className="container create-nft">
      <div className="card m-5 p-4">
        <div className="mb-3">
          <label htmlFor="nftName" className="form-label">
            NFT Name
          </label>
          <input
            type="text"
            className="form-control"
            id="nftName"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="nftPrice" className="form-label">
            Bid Price
          </label>
          <input
            type="number"
            className="form-control"
            id="nftPrice"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="NFTimage" className="form-label">
            Image
          </label>
          <input
            type="file"
            className="form-control-file"
            id="NFTimage"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            className="form-control"
            id="description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <form onSubmit={(e) => addAttribute(e)} ref={formRef}>
          <div className="mb-3">
            <label htmlFor="attributes" className="form-label">
              Attributes
            </label>
          <div  className="d-flex flex-wrap">
            {
              attributes?
              attributes.map((attr,i)=>{
                return (
                  <span key={i} className="m-1 badge attr-badge" onClick={()=>removeAttribute(attr.id)}>{attr.trait_type}:{attr.value}</span>
                )
              })
              :""
            }
          </div>
            <div className="d-flex attribute">
              <input
                type="text"
                name="key"
                className="form-control m-1"
                placeholder="Key"
                required
              />
              <input
                type="text"
                name="value"
                className="form-control m-1"
                placeholder="Value"
                required
              />
              <button type="submit" className="btn btn-primary mb-2 btn-sm">
                Add
              </button>
            </div>
          </div>
        </form>
        <button type="submit" className="btn btn-success btn-block" onClick={()=>uploadImageToIPFS()} disabled={loader}>
          {loader?"Minting...":"Mint NFT"}
        </button>
      </div>
    </div>
  );
};

export default basicAuth(Mint);
