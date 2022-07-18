import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BetDia } from "../target/types/bet_dia";

describe("betDia", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.BetDia as Program<BetDia>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
