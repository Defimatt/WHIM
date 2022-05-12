import { config } from '../dapp.config'

const { createAlchemyWeb3 } = require('@alch/alchemy-web3')
const { MerkleTree } = require('merkletreejs')
const contract = require('../artifacts/contracts/WHIM.sol/WHIM.json')
const keccak256 = require('keccak256')
const allowlist = require('../scripts/allowlist.js')

const web3 = createAlchemyWeb3(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL)

const nftContract = new web3.eth.Contract(contract.abi, config.contractAddress)

const leafNodes = allowlist.map((addr) => keccak256(addr))
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
const root = merkleTree.getRoot()

export const getTotalMinted = async () => {
  const totalMinted = await nftContract.methods.totalSupply().call()
  return totalMinted
}

export const getClaimed = async address => {
  if (!address) return false
  
  const claimed = await nftContract.methods.claimed(address).call()
  return claimed
}

export const mint = async () => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: 'Connect your wallet before minting'
    }
  }

  const leaf = keccak256(window.ethereum.selectedAddress)
  const proof = merkleTree.getHexProof(leaf)
  const isValid = merkleTree.verify(proof, leaf, root)

  if (!isValid) {
    return {
      success: false,
      status: '😞 Sorry, you are not on the allowlist'
    }
  }

  const nonce = await web3.eth.getTransactionCount(
    window.ethereum.selectedAddress,
    'latest'
  )

  const tx = {
    to: config.contractAddress,
    from: window.ethereum.selectedAddress,
    data: nftContract.methods
      .mint(proof)
      .encodeABI(),
    nonce: nonce.toString(16)
  }

  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

    return {
      success: true,
      status: (
        <a href={`https://rinkeby.etherscan.io/tx/${txHash}`} target="_blank">
          <p>✅ Check out your transaction on Etherscan:</p>
          <p>{`https://rinkeby.etherscan.io/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: '😞 Sorry, something went wrong: ' + error.message
    }
  }
}
