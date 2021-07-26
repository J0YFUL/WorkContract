const Work = artifacts.require('./Work.sol')
const fs = require('fs')

module.exports = function (deployer) {
  deployer.deploy(Work)
    .then(() => {
      if (Work._json) {
        fs.writeFile(
          'deployedABI',
          JSON.stringify(Work._json.abi),
          (err) => {
            if (err) throw err
            console.log("파일에 ABI 입력 성공");
          })
      }

      fs.writeFile(
        'deployedAddress',
        Work.address,
        (err) => {
          if (err) throw err
          console.log("파일에 주소 입력 성공");
        })
    })
}