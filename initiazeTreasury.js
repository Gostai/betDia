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
  
  //Minted tokens:  EwJr2ibR39HTBPJqKEP9etqcMmJ9hb7djLxe28vwM6oF 
  MINT ="EwJr2ibR39HTBPJqKEP9etqcMmJ9hb7djLxe28vwM6oF";
  
  //User  accounts
  console.log('User main public key (SOL): ' + provider.wallet.publicKey);
  
  
  
  //Find pdaAccount for treasury
  
  const [_vault_account_pda, _vault_account_bump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("token-seed"))],
      program.programId
    );
    vault_account_pda = _vault_account_pda;
    vault_account_bump = _vault_account_bump;
    
    //find authority for treasury account
    const [_vault_authority_pda, _vault_authority_bump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("betEscrow"))],
      program.programId
    );
    vault_authority_pda = _vault_authority_pda;
    
    console.log('Treasure account  (smart contract deposit): ' + vault_account_pda);
    
    console.log('Treasure authority: ' + vault_authority_pda);
 
    //Transaction to create treasury account with authority
    const tx = program.transaction.initialize(
      
      {
        accounts: {
          initializer: provider.wallet.publicKey,
          vaultAccount: vault_account_pda,
          mint: MINT,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        
        signers: [ provider.wallet],
      }
    );
    
    //Signing created transaction with cmd wallet
    tx.feePayer = await provider.wallet.publicKey;
    tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    //tx.sign(escrowAccount);
    const signedTx = await provider.wallet.signTransaction(tx);
    const txId = await provider.connection.sendRawTransaction(signedTx.serialize());
    await provider.connection.confirmTransaction(txId)
    
    console.log("Fetching transaction logs...");
  let t = await provider.connection.getConfirmedTransaction(txId, "confirmed");
  console.log(t.meta.logMessages);

    
}

console.log("Running client...");
main().then(() => console.log("Success"));
