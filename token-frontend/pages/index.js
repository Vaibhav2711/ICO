import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import {BigNumber,providers,Contract,utils} from "ethers";
import Web3Modal from "web3modal";
import styles from '../styles/Home.module.css'

export default function Home() {

  
  const [walletConnected,setWalletConnected] = useState(false);
  const [loading,setLoading] = useState(false);
  const zero = BigNumber.from(0);
  // tokensToBeClaimed keeps track of the number of tokens that can be claimed
  // based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
  const [balanceOfCryptoMinionTokens, setBalanceOfCryptoMinionTokens] = useState(zero);
  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState(zero);
  // isOwner gets the owner of the contract through the signed address
  const [isOwner, setIsOwner] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) =>{
    const provider = await web3ModalRef.current.connect();
    const web3provider = new providers.Web3Provider(provider);
    const {chainId} = await web3provider.getNetwork();
    if(chainId != 5){
      window.alert("Change the network to Goerli");
      throw new Error("Change the network to Goerli");
    }
    if(needSigner){
      const signer = web3provider.getSigner();
      return signer;
    }
    return web3provider;
  }
  const connectWallet = async () =>{
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(err){
      console.error(err);
    }
  };

  const getOwner = async () => {
    try{
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
      const _owner = await tokenContract.owner();
      const signer = await getProviderOrSigner(true);
      const _address = await signer.getAddress();
      if(_owner.toLowerCase() == _address.toLowerCase()){
        setIsOwner(true);
      }
    }catch(err){
      console.error(err);
    }
  };

  const withdrawCoins = async () =>{
    try{
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,signer);
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    }catch(err){
      console.error(err);
    }
  };

  const getBalanceOfCryptoMinionTokens = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
      const signer = await getProviderOrSigner(true);
      const address = signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoMinionTokens(balance);
    }catch(err){
      console.error(err);
      setBalanceOfCryptoMinionTokens(zero);
    }
  };

  const getTotalTokensMinted = async () => {
    try{
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    }catch(err){
      console.error(err);
    }
  };

  const getTokensToBeClaimed = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);
      const signer = await getProviderOrSigner(true);
      const address = signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      if(balance == zero){
        setTokensToBeClaimed(zero);
      }else{
        var amount = 0;
        for(var i =0;i< balance;i++){
          const tokenId = await nftContract.tokenOfOwnerByIndex(address,i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if(!claimed){
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    }catch(err){
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };

  const claimToken = async () => {
    try{
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,signer);
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully claimed Crypto Minion Tokens");
      await getBalanceOfCryptoMinionTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    }catch(err){
      console.error(err);
    }
  };

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoMinionTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  const mintCryptoDevToken = async (amount) => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value signifies the cost of one crypto dev token which is "0.001" eth.
        // We are parsing `0.001` string to ether using the utils library from ethers.js
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoMinionTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };


  const renderButton = () => {
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className = {styles.button}>Connect Wallet!!</button>
      );
    }
    if(loading){
      return(
        <button className={styles.button}>Loading...</button>
      );
    }
    // if owner is connected, withdrawCoins() is called
    if(walletConnected && isOwner){
      return(
      <button className={styles.button} onClick = {withdrawCoins}>Withdraw Coins</button>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if(tokensToBeClaimed > 0){
      return(
        <button className={styles.button} onClick = {claimToken}>Claim Token</button>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return(
      <div style={{ display: "flex-col" }}>
        <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}/>
        <button
        className={styles.button}
        disabled={!(tokenAmount > 0)}
        onClick={() => mintCryptoDevToken(tokenAmount)}>
        Mint Tokens</button>
      </div>
    )
  }
  
  return (
    <div>
      <Head>
        <title>Crypto Minions NFT</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <div className={styles.title}>
            <h1>Welcome to Crypto Minions ICO!</h1></div>
          <div className ={styles.description}>You can claim or mint Crypto Minion token here</div>
          <div className={styles.description}>You have minted {utils.formatEther(balanceOfCryptoMinionTokens)} Crypto Minion Tokens</div>
          <div className={styles.description}>Overall {utils.formatEther(tokensMinted)}/100000 have been minted!!!</div>
          <div>{renderButton()}</div>
        </div>
        <div>
          <img className={styles.image} src = './img.png' />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Minions
      </footer>
    </div>
  )
}
