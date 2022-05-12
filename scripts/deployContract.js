const hre = require('hardhat')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const allowlist = require('./allowlist.js')

async function main() {
  const leafNodes = allowlist.map((addr) => keccak256(addr))
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
  const root = merkleTree.getRoot()

  console.log(root.toString('hex'))

  const WHIM = await hre.ethers.getContractFactory('WHIM')
  const whim = await WHIM.deploy(
    '', // _coordinator
    '', // royaltyReceiver
    0, // royaltyAmount
    '' // _unrevealedURI
  )

  await whim.deployed()

  console.log('WHIM deployed to:', whim.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
