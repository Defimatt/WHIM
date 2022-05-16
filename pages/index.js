import { useState, useEffect } from 'react'
import { initOnboard } from '../utils/onboard'
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import { config } from '../dapp.config'
import { ethers } from 'ethers'
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

export default function Mint() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [status, setStatus] = useState(null)
  const [totalMinted, setTotalMinted] = useState(0)
  const [isMinting, setIsMinting] = useState(false)
  const [claimed, setIsClaimed] = useState(false)
  const [onboard, setOnboard] = useState(null)

  const getTotalMinted = async () => {
    const totalMinted = await nftContract.methods.totalSupply().call()
    return totalMinted
  }
  
  const getClaimed = async (address) => {
    if (!address) return false
  
    const claimed = await nftContract.methods.claimed(address).call()
    return claimed
  }
  
  const mint = async () => {
    if (!provider) {
      return {
        success: false,
        status: 'Connect your wallet before minting'
      }
    }
  
    const leaf = keccak256(wallet?.accounts[0]?.address)
    const proof = merkleTree.getHexProof(leaf)
    const isValid = merkleTree.verify(proof, leaf, root)
  
    if (!isValid) {
      return {
        success: false,
        status: '😞 Sorry, you are not on the allowlist'
      }
    }
  
    const signer = window.provider.getUncheckedSigner()
  
    try {
      const {txHash} = await signer.sendTransaction({
        to: config.contractAddress,
        data: nftContract.methods.mint(proof).encodeABI()
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

  useEffect(() => {
    setOnboard(initOnboard)
  }, [])

  useEffect(() => {
    setStatus(null)
    async function updateClaimedStatus() {
      setIsClaimed(!(wallet?.accounts[0]?.address) ? false : await getClaimed(wallet?.accounts[0]?.address))
    }

    updateClaimedStatus()
    
    if (!wallet?.provider) {
      window.provider = null
    } else {
      window.provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
    }
  },[wallet])

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets])

  useEffect(() => {
    if (!onboard) return

    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true
          }
        })
      }

      setWalletFromLocalStorage()
    }
  }, [onboard, connect])

  useEffect(() => {
    const init = async () => {
      setTotalMinted(await getTotalMinted())
    }

    init()
  }, [])

  const mintHandler = async () => {
    setIsMinting(true)

    const { success, status } = await mint()

    setStatus({
      success,
      message: status
    })

    setIsMinting(false)
  }

  return (
    <div className="min-h-screen h-full w-full overflow-hidden flex flex-col items-center justify-center bg-brand-background ">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <img
          src="/images/blur.jpeg"
          className="animate-pulse-slow absolute inset-auto block w-full min-h-screen object-cover"
        />

        <div className="flex flex-col items-center justify-center h-full w-full px-2 md:px-10">
          <div className="relative z-1 md:max-w-3xl w-full bg-gray-900/90 filter backdrop-blur-sm py-4 rounded-md px-2 md:px-10 flex flex-col items-center">
            {wallet && (
              <button
                className="absolute right-4 bg-indigo-600 transition duration-200 ease-in-out font-chalk border-2 border-[rgba(0,0,0,1)] shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none px-4 py-2 rounded-md text-sm text-white tracking-wide uppercase"
                onClick={() =>
                  disconnect({
                    label: wallet.label
                  })
                }
              >
                Disconnect
              </button>
            )}
            <h1 className="font-bold text-3xl md:text-4xl bg-gradient-to-br  from-brand-green to-brand-blue bg-clip-text text-transparent mt-3">
              Mint WHIM NFT
            </h1>
            <h3 className="text-sm text-pink-200 tracking-widest">
              {wallet?.accounts[0]?.address
                ? wallet?.accounts[0]?.address.slice(0, 8) +
                  '...' +
                  wallet?.accounts[0]?.address.slice(-4)
                : ''}
            </h3>

            <div className="flex flex-col md:flex-row md:space-x-14 w-full mt-10 md:mt-14">
              <div className="relative w-full">
                <div className="z-10 absolute top-2 left-2 opacity-80 filter backdrop-blur-lg text-base px-4 py-2 bg-black border border-brand-purple rounded-md flex items-center justify-center text-white font-semibold">
                  <p>
                    <span className="text-brand-pink">{totalMinted} minted</span>
                  </p>
                </div>

                <img
                  src="/images/13.png"
                  className="object-cover w-full sm:h-[280px] md:w-[250px] rounded-md"
                />
              </div>

              <div className="flex flex-col items-center w-full px-4 mt-16 md:mt-0">
                {/* Mint Button && Connect Wallet Button */}
                {wallet ? (
                  <button
                    className={` ${
                      isMinting
                        ? 'bg-gray-900 cursor-not-allowed'
                        : 'bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg hover:shadow-pink-400/50'
                    } mt-12 w-full px-6 py-3 rounded-md text-2xl text-white  mx-4 tracking-wide`}
                    disabled={isMinting || claimed}
                    onClick={mintHandler}
                  >
                    {claimed ? 'Already claimed' : isMinting ? 'Minting...' : 'Mint'}
                  </button>
                ) : (
                  <button
                    className="mt-12 w-full bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg px-6 py-3 rounded-md text-2xl text-white hover:shadow-pink-400/50 mx-4 tracking-wide"
                    onClick={() => connect()}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            {status && (
              <div
                className={`border ${
                  status.success ? 'border-green-500' : 'border-brand-pink-400 '
                } rounded-md text-start h-full px-4 py-4 w-full mx-auto mt-8 md:mt-4"`}
              >
                <p className="flex flex-col space-y-2 text-white text-sm md:text-base break-words ...">
                  {status.message}
                </p>
              </div>
            )}

            {/* Contract Address */}
            <div className="border-t border-gray-800 flex flex-col items-center mt-10 py-2 w-full">
              <h3 className="text-2xl text-brand-pink mt-6">
                Contract Address
              </h3>
              <a
                href={`https://rinkeby.etherscan.io/address/${config.contractAddress}#readContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 mt-4"
              >
                <span className="break-all ...">{config.contractAddress}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
