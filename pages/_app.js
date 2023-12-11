import '../styles/globals.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {wrapper} from '../redux/store'
import { loadAccount, loadContracts, loadUnsoldNFT, loadWeb3 } from "../redux/interactions";
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { quais } from 'quais';

function MyApp({ Component, pageProps }) {

  const dispatch = useDispatch()

  useEffect(() => {
    loadBlockchain()
  }, [])

  const loadBlockchain = async () => {

    const provider = await loadWeb3(dispatch);

    if (!provider) {
        console.error("Failed to load provider");
        return;
    }

    try {
        const contracts = await loadContracts(provider, dispatch);
        await loadUnsoldNFT(provider, contracts.marketplace, contracts.nft, dispatch);
    } catch (error) {
        console.error("Error in loading blockchain data:", error);
    }
}


  return <><ToastContainer /><Component {...pageProps} /></>
}

export default wrapper.withRedux(MyApp)
