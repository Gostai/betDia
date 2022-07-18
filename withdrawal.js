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



async function main() {
  // Read the generated IDL.  
  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/anchor_bet.json", "utf8")
  );
  
  // Address of the deployed program.
  const programId = new anchor.web3.PublicKey(args['program']);

  // Generate the program client from IDL.
  const program = new anchor.Program(idl, programId);
  
  
  //User  accounts
  console.log('User main public key (SOL): ' + provider.wallet.publicKey);
   
  TREASURY_ACCOUNT_PDA = "F9kpqvvcCgzxKmCUKR2xruvzPG65jRjv4qgxzXJpr3yG";
  const treasuryPubkey = new PublicKey(TREASURY_ACCOUNT_PDA);  
  TREASURY_AUTHORITY_PDA = "HZYKAu5avVgBPV82aapS3fjN1nNvwfGa2tffAuVUTZcP";
  
  console.log('Treasure account  (smart contract deposit): ' + TREASURY_ACCOUNT_PDA); 
  
  let treasuryBalance = await provider.connection.getTokenAccountBalance(treasuryPubkey);
  console.log("TREASURY_ACCOUNT_PDA balance : ", treasuryBalance.value.uiAmountString )
    
  
  WITHDRAWAL_ACCOUNT = "GqqF2ZnhbTDNM6DaTpUeQTZVy2ShfLMDeWb6yM4hQWzM";
  console.log("WITHDRAWAL_ACCOUNT  : ", WITHDRAWAL_ACCOUNT );
  
  const withdrawPubkey = new PublicKey(WITHDRAWAL_ACCOUNT);  
  let withdrawBalance = await provider.connection.getTokenAccountBalance(withdrawPubkey);
  console.log("WITHDRAWAL_ACCOUNT balance : ", withdrawBalance.value.uiAmountString )
  
  //Transaction to start withdrawal
  const tx = program.transaction.withdrawal(   
    new anchor.BN(100),                                 //bet amount
        {
    accounts: {
      withdrawalAccount: WITHDRAWAL_ACCOUNT,
      treasuryAccount: TREASURY_ACCOUNT_PDA,            //escrow treasury
      treasuryAuthority: TREASURY_AUTHORITY_PDA,        //escrow treasury authority       
      tokenProgram: TOKEN_PROGRAM_ID,
      user: provider.wallet.publicKey,
      
    },
    options: { commitment: "confirmed" },
    signers: [provider.wallet],
  });

  //Signing created transaction with cmd wallet
  tx.feePayer = await provider.wallet.publicKey;
  tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
  
  const signedTx = await provider.wallet.signTransaction(tx);
  const txId = await provider.connection.sendRawTransaction(signedTx.serialize());
  await provider.connection.confirmTransaction(txId)

  console.log("Fetching transaction logs...");
  let t = await provider.connection.getConfirmedTransaction(txId, "confirmed");
  console.log(t.meta.logMessages);
  
  treasuryBalance = await provider.connection.getTokenAccountBalance(treasuryPubkey);
  console.log("TREASURY_ACCOUNT_PDA balance : ", treasuryBalance.value.uiAmountString )
 
  withdrawBalance = await provider.connection.getTokenAccountBalance(withdrawPubkey);
  console.log("WITHDRAWAL_ACCOUNT balance : ", withdrawBalance.value.uiAmountString )
  
}

console.log("Running client...");
main().then(() => console.log("Success"));
