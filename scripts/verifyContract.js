require('@nomiclabs/hardhat-etherscan')
const hre = require('hardhat')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const allowlist = require('./allowlist.js')

async function main() {
  const leafNodes = allowlist.map((addr) => keccak256(addr))
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
  const root = merkleTree.getRoot()

  await hre.run('verify:verify', {
    address: '',
    constructorArguments: [
      '', // _coordinator
      '', // royaltyReceiver
      0, // royaltyAmount
      '' // _unrevealedURI
    ]
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
