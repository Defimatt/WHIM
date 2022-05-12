const hre = require('hardhat')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const allowlist = require('./allowlist.js')

async function main() {
  const nftFactory = await hre.ethers.getContractFactory('WHIM')
  const nftContract = await nftFactory.attach(
    '' // Deployed contract address
  )

  const leafNodes = allowlist.map((addr) => keccak256(addr))
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
  const root = merkleTree.getRoot()

  console.log(root.toString('hex'))

  return

  await nftContract.setMerkleRoot(root)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
