import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import coinbaseModule from '@web3-onboard/coinbase'
import fortmaticModule from '@web3-onboard/fortmatic'

import WHIMLogo from '../WHIMLogo'

const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL

const fortmatic = fortmaticModule({
  apiKey: process.env.NEXT_PUBLIC_FORTMATIC_KEY
})

const injected = injectedModule()
const walletConnect = walletConnectModule()
const coinbaseWallet = coinbaseModule()

const initOnboard = init({
  wallets: [walletConnect, coinbaseWallet, injected, fortmatic],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: ''
    },
    {
      id: '0x4',
      token: 'rETH',
      label: 'Ethereum Rinkeby Testnet',
      rpcUrl: RPC_URL
    }
  ],
  appMetadata: {
    name: 'WHIM',
    icon: WHIMLogo,
    description: 'WHIM is a category defining device built in a completely new geometry, available in multiple sizes.',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' },
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
    ],
  }
})

export { initOnboard }
