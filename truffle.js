// const PrivateKeyConnector = require('connect-privkey-to-provider')
const HDWalletProvider = require("truffle-hdwallet-provider-klaytn");
const NETWORK_ID = '1001'
const GASLIMIT = '20000000'
const URL = `https://api.baobab.klaytn.net:8651`
const PRIVATE_KEY = '0x5f1727e0a20231fb53026632df9f95965a90a8cd1e3bb109c194d3e2d5b40ac2' // 사용시 자신의 Private Key값을 입력함.

module.exports = {
  networks: {  
    klaytn: {
      provider: new HDWalletProvider(PRIVATE_KEY, URL),
      // provider: new PrivateKeyConnector(PRIVATE_KEY, URL),
      network_id: NETWORK_ID,
      gas: GASLIMIT,
      gasPrice: null,
    }
  },
}