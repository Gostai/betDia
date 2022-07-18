// Parse arguments
// --program - [Required] The account address for your deployed program.
// --feed - The account address for the Chainlink data feed to retrieve
const anchor = require("@project-serum/anchor");

//PublicKey for token programm of SOLANA
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const solanaWeb3 = require('@solana/web3.js');
const {PublicKey} = require("@solana/web3.js");

const args = require('minimist')(process.argv.slice(2));

// Initialize Anchor and provider
const provider = anchor.Provider.env();
// Configure the cluster.
anchor.setProvider(provider);

//PublicKey for chainlink programm
const CHAINLINK_PROGRAM_ID = "HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny";
const DIVISOR = 100000000;

// Data feed account address
// Default is SOL / USD
const default_feed = "HgTtcbcmp5BeThax5AU8vg4VwK79qAvAKKFMs8txMLW6";
const CHAINLINK_FEED = args['feed'] || default_feed;

async function main() {
  // Read the generated IDL.  
  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/anchor_bet.json", "utf8")
  );
  
  // Address of the deployed program.
  const programId = new anchor.web3.PublicKey(args['program']);

  // Generate the program client from IDL.
  const program = new anchor.Program(idl, programId);
  
  //Minted tokens:  EwJr2ibR39HTBPJqKEP9etqcMmJ9hb7djLxe28vwM6oF 
  //Token account with the minted tokens for bet
  USER_DEPOSIT_TOKEN_ACCOUNT = "FaVQBqKVUaSBsNWuGAz2goL3x59mrVtoSaFhjDwAeTFK";
  const depositPubkey = new PublicKey(USER_DEPOSIT_TOKEN_ACCOUNT);
  
  //create an account to store the price and bett data
  const  escrowAccount = anchor.web3.Keypair.generate();
    
  TREASURY_ACCOUNT_PDA = "F9kpqvvcCgzxKmCUKR2xruvzPG65jRjv4qgxzXJpr3yG";
  const treasuryPubkey = new PublicKey(TREASURY_ACCOUNT_PDA);
  
  TREASURY_AUTHORITY_PDA = "HZYKAu5avVgBPV82aapS3fjN1nNvwfGa2tffAuVUTZcP";
    
  console.log('Generated escrow account public key: ' + escrowAccount.publicKey);
  //User  accounts
  console.log('User main public key (SOL): ' + provider.wallet.publicKey);
  
  console.log('User token public key (bet deposit): ' + USER_DEPOSIT_TOKEN_ACCOUNT);
  
  //Show balances before bet  
  let userDepositTokenBalance = await provider.connection.getTokenAccountBalance( depositPubkey);
  console.log("USER_DEPOSIT_TOKEN_ACCOUNT balance : ", userDepositTokenBalance.value.uiAmountString );
  
  console.log('Treasure account  (smart contract deposit): ' + TREASURY_ACCOUNT_PDA);
 
  
  let treasuryBalance = await provider.connection.getTokenAccountBalance(treasuryPubkey);
  console.log("TREASURY_ACCOUNT_PDA balance : ", treasuryBalance.value.uiAmountString )
  
  //Transaction to start bet
  const tx = program.transaction.execute(
      new anchor.BN(100),        //bet amount
      new anchor.BN(2),          //bet_on_name 0/1/2 rise/equal/decrease                                  
        {
    accounts: {
      //coinInfo: "FJpv98TrcWURFaGXVRnzwQ7gfdF2ZWzKYeRo6Y3Jim9Z",
      escrowAccount: escrowAccount.publicKey,              //generated escrow 
      user: provider.wallet.publicKey,                     //better main account
      treasuryAccount: TREASURY_ACCOUNT_PDA,               //escrow treasury
      userDepositTokenAccount: USER_DEPOSIT_TOKEN_ACCOUNT, //user account with tokens
      chainlinkFeed: CHAINLINK_FEED,                       //CoinName
      chainlinkProgram: CHAINLINK_PROGRAM_ID,              //Chainlink program
      systemProgram: anchor.web3.SystemProgram.programId,  //System program      
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    instructions: [
          await program.account.escrowAccount.createInstruction(escrowAccount),
    ],
    options: { commitment: "confirmed" },
    signers: [escrowAccount, provider.wallet],
  });
  //Signing created transaction with cmd wallet
  tx.feePayer = await provider.wallet.publicKey;
  tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
  tx.sign(escrowAccount);
  const signedTx = await provider.wallet.signTransaction(tx);
  const txId = await provider.connection.sendRawTransaction(signedTx.serialize());
  await provider.connection.confirmTransaction(txId)

  console.log("Fetching transaction logs...");
  let t = await provider.connection.getConfirmedTransaction(txId, "confirmed");
  console.log(t.meta.logMessages);
  // #endregion main

  // Fetch the account details of the account containing the price and bet data
  const _escrowAccount = await program.account.escrowAccount.fetch(escrowAccount.publicKey);
  console.log('Price for choosen coin is: ' + _escrowAccount.value / DIVISOR);
  console.log('Bet amount Is: ' + _escrowAccount.betAmount );                                               
  console.log('Bet on result Is: ' + _escrowAccount.betOnResult );
  console.log('Pair name: ' + _escrowAccount.pairName );
  console.log('Better account : ' + _escrowAccount.betterAccount );
  
  
  
  userDepositTokenBalance = await provider.connection.getTokenAccountBalance( depositPubkey);
  console.log("USER_DEPOSIT_TOKEN_ACCOUNT balance : ", userDepositTokenBalance.value.uiAmountString );
  
  treasuryBalance = await provider.connection.getTokenAccountBalance(treasuryPubkey);
  console.log("TREASURY_ACCOUNT_PDA balance : ", treasuryBalance.value.uiAmountString )
  
  //Take a time for a bet check
  pause=15
  console.log('waiting for '+pause+' sec...');
  await new Promise(resolve => setTimeout(resolve, pause*1000));
  
  //Create bet checking transaction
  let tx2 = await program.rpc.checkBet(                 
        {
    accounts: {
      escrowAccount: escrowAccount.publicKey,           //generated escrow with props
      chainlinkFeed: CHAINLINK_FEED,                    //CoinName
      chainlinkProgram: CHAINLINK_PROGRAM_ID,           //Chainlink program
      treasuryAccount: TREASURY_ACCOUNT_PDA,            //escrow treasury
      treasuryAuthority: TREASURY_AUTHORITY_PDA,        //escrow treasury authority
      userDepositTokenAccount: USER_DEPOSIT_TOKEN_ACCOUNT, //betToken user account      
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    options: { commitment: "confirmed" },
    signers: [escrowAccount],
  });

  console.log("Fetching transaction logs...");
  let t2 = await provider.connection.getConfirmedTransaction(tx2, "confirmed");
  console.log(t2.meta.logMessages);
  
  // Fetch the account details of the account containing the price and bet data
  const _escrowAccountCheck = await program.account.escrowAccount.fetch(escrowAccount.publicKey);
  console.log('Price Is: ' + _escrowAccountCheck.value / DIVISOR);
  console.log('Bet amount after closing escrow: ' + _escrowAccountCheck.betAmount );                                               
  console.log('Bet on result is: ' + _escrowAccountCheck.betOnResult );
  console.log('Coin pair name: ' + _escrowAccountCheck.pairName );
  console.log('Better account : ' + _escrowAccountCheck.betterAccount );
  if (_escrowAccountCheck.userWins) {
      console.log('User WINS a bet')
  } else {
      console.log('User LOOSE a bet')
 }
  
  userDepositTokenBalance = await provider.connection.getTokenAccountBalance( depositPubkey);
  console.log("USER_DEPOSIT_TOKEN_ACCOUNT balance : ", userDepositTokenBalance.value.uiAmountString );
  
  treasuryBalance = await provider.connection.getTokenAccountBalance(treasuryPubkey);
  console.log("TREASURY_ACCOUNT_PDA balance : ", treasuryBalance.value.uiAmountString )
  
  console.log("Bet is closed");
  
}

console.log("Running client...");
main().then(() => console.log("Success"));
