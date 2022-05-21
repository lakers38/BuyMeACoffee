import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import Image from 'next/image'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css';
import moment from "moment";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x5a0d4781Eda8bF7aeB480278C7e2b0AD04262BA4";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event) => {
    setName(event.target.value);
  }

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({method: 'eth_accounts'})
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        setCurrentAccount(account);
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const buyCoffee = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..")
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          {value: ethers.utils.parseEther("0.001")}
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        
        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
    };

    const {ethereum} = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, []);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Buy me a coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
     
        <main className={styles.main}>
        
          {currentAccount ? (
          <div>
            <form>
              <div>
                <label className={styles.textBoxLabel}>
                  Name
                </label>
                <br/>
                
                <input
                  id="name"
                  type="text"
                  placeholder="anon"
                  onChange={onNameChange}
                  style={{marginTop: "2%"}}
                  />
              </div>
              <br/>
              <div>
                <label className={styles.textBoxLabel}>
                  Send Praneet a message
                </label>
                <br/>

                <textarea
                  className={styles.messageInputBox}
                  placeholder="Enjoy your coffee!"
                  id="message"
                  onChange={onMessageChange}
                  style={{ marginBottom: "2.5%", marginTop: "2%"}}
                  required
                >
                </textarea>
              </div>
              <div style={{ display: 'flex',justifyContent: 'center',
  alignItems: 'center', marginTop: "2%"}}>
                <button
                  type="button"
                  onClick={buyCoffee}
                  className={styles.coffeeButton}
                >
                </button>
              </div>
            </form>
          </div>
        ) : (
        <div className={styles.titlePageText}>
        <h1 className={styles.title}>
          Buy me a coffee!
        </h1>
        <p className={styles.titleCaption}>
          Web3 has a shortage of developers and I am tirelessy trying to help lessen the              shortage by 1 developer. Fren, fuel me with some coffee.
        </p>
      </div>
      )}
          {!currentAccount && <button className={styles.metamaskButton} onClick={connectWallet}> </button>}

          
          {currentAccount && (<h1 className={styles.titleCaption} style={{paddingBottom: "5%", paddingTop: "5%"}}>Memos received</h1>)}

      {currentAccount && 
        (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridGap: '10px', gridAutoRows: 'minMax(100px, auto)'}}>
            {memos.map((memo, idx) => {
        return (
          <div key={idx} style={{border:"2px solid rgb(139, 137, 157)", "borderRadius":"5px", padding: "5px", margin: "5px"}}>
            <p style={{"fontWeight":"bold", "color": "white"}}>"{memo.message}"</p>
            <p style={{ "color": "white"}}> From: {memo.name} at {moment.unix(memo.timestamp).format("LLL")}</p>
          </div>
        )
      })}
          </div>
         )}

      <footer className={styles.footer}>
        <a
          href="https://alchemy.com/?a=roadtoweb3weektwo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by @praneetkedari for Alchemy's Road to Web3 lesson two!
        </a>
      </footer>
      </main>
      

      
    </div>
  )
}
