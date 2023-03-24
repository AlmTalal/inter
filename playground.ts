import { utils as eUtils, BigNumber } from "ethers";
import { BlockTag, Provider } from "@ethersproject/abstract-provider";
import { utils } from "@relicprotocol/client";
import {ethers} from "ethers";

const NOUNS_ADDRESS = "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03";

// SlotIndex is an index of storage slots we are interested in
export enum SlotIndex {
  // The storage slot of the mapping containing Nouns storage balance
  TokenBalance = 4,
  // The storage slot of the mapping containing Nouns delegate addresses
  Delegatee = 11,
}

export type NounsArt = {
  svg: string;
  id: BigNumber;
};

export type StorageSlotBatch = {
  block: BlockTag;
  address: string;
  slots: string[];
  values: string[];
  art: NounsArt[];
};


export class Storage {
  // Ethers provider
  private _provider: Provider;
  // The Nouns token address
  private _tokenAddress: string;

  constructor(p: Provider, ta: string = NOUNS_ADDRESS) {
    const fn = async () => {
      this._provider = p;
      this._tokenAddress = ta;
    };

    fn();
  }

  // getStorageValues build a storage slot request for a given address and block
  async getStorageValues(addr: string, b: BlockTag): Promise<StorageSlotBatch> {
    // nouns token balance at block
    const tbSlot = utils.mapElemSlot(SlotIndex.TokenBalance, addr).toHexString();
    const tbStorage = await this._provider.getStorageAt(this._tokenAddress, tbSlot, b);
    const tbValue = eUtils.hexZeroPad(BigNumber.from(tbStorage).toHexString(), 32);
    console.log("Hola");
    // nouns delegated at block
    const dSlot = utils.mapElemSlot(SlotIndex.Delegatee, addr).toHexString();
    const dStorage = await this._provider.getStorageAt(this._tokenAddress, dSlot, b);
    const dValue = eUtils.hexZeroPad(BigNumber.from(dStorage).toHexString(), 32);

    /*
      TODO
      
      *NOTE* Above are 2 examples of how to get storage values from a contract.
      Read the following and then the above will make more sense.

      ----

      We need to get the noun ids owned by an address at any given block. Because 
      calling a smart contract will only return the current state of the blockchain
      we need another way to access historical data. Luckily archive nodes store
      the complete history of the blockchain, so if we connect to one we will be
      able to read data directly from storage. (you can use a free infura account)

      Here's the documentation on how data is laid out in storage: 
      https://docs.soliditylang.org/en/v0.8.17/internals/layout_in_storage.html

      You can also watch this youtube video for a more guided explanation:
      https://www.youtube.com/watch?v=Gg6nt3YW74o&list=PLPrV9CBEjHY3VTflDoDkYGqSGrn_wdIw6&index=1&t=1s
      
      - tokenOwnerByIndex() defined in ERC721Enumerable [0] is used to get the noun ids owned by an address
        - this function reads data stored in the following mapping
          mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

        - your goal is to get the token id of each value stored in this mapping
          for an address at a given block. if an address owns 3 tokens, you should
          be able to get the ids of all 3 of them

        - you will use these ids to get the svg data returned from tokenURI(). when getting
          the svg data, you don't need to read historical data from slots. the data
          is available in the current state of the chain

      [0]: https://github.com/nounsDAO/nouns-monorepo/blob/master/packages/nouns-contracts/contracts/base/ERC721Enumerable.sol
    */

    return {
      block: b,
      address: NOUNS_ADDRESS,
      slots: [tbSlot, dSlot],
      values: [tbValue, dValue],
      art: [], // TODO :- add this
    };
  }
}

const providerUrl = 'https://mainnet.infura.io/v3/5d19e896f00c4840bb5be686f31d8e0c';
const _provider = Provider(providerUrl);

const storage = new Storage(_provider,NOUNS_ADDRESS);

storage.getStorageValues("0x49D24586F8C6dA7BedBbabd915184F5EA56EBAd3",16893661)