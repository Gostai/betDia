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
const CHAINLINK_PROGRAM_ID = "CaH12fwNTKJAG8PxEvo9R96Zc2j8qNHZaFj8ZW49yZNT";
const DIVISOR = 100000000;

// Data feed account address
// Default is SOL / USD
const default_feed = "EdWr4ww1Dq82vPe8GFjjcVPo2Qno3Nhn6baCgM3dCy28";
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
  
  
  //User  accounts
  console.log('User main public key (SOL): ' + provider.wallet.publicKey);  
  
  coinPDA = new PublicKey("FJpv98TrcWURFaGXVRnzwQ7gfdF2ZWzKYeRo6Y3Jim9Z");  
  
  let coinInfo = await program.account.coinInfo.fetch(coinPDA);
  
  console.log("CoinInfo is : ", coinInfo );
  
}

console.log("Running client...");
main().then(() => console.log("Success"));
