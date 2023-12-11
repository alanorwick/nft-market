import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadAccount } from "../redux/interactions";

const NavBar = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3Reducer.account);
  const provider = useSelector((state) => state.web3Reducer.connection);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Set this flag to true only on the client side
    const ethereum = window.ethereum;
    if (ethereum) {
      ethereum.on('accountsChanged', accountChanged);
      ethereum.on('chainChanged', chainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', accountChanged);
        ethereum.removeListener('chainChanged', chainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await loadAccount(provider, dispatch);
      } catch (err) {
        console.error('Error getting accounts.', err);
      }
    }
  };

  const accountChanged = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const chainChanged = () => {
    window.location.reload();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link href="/">
          <span className="navbar-brand logo">NFT</span>
        </Link>

        {isMounted && account ? (
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item active">
                <Link href="/creator-profile">
                <span className="nav-link">Creator Profile</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/my-orders">
                  <span className="nav-link">My NFTs</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/mint">
                  <span className="nav-link">Create NFT</span>
                </Link>
              </li>
            </ul>
          </div>
        ) : (
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item active">
                <span className="nav-link" onClick={connectWallet}>
                  Connect with wallet
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
