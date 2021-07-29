import Caver from "caver-js";
import { Spinner } from "spin.js";

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);
const WorkContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);

const App = {
  auth: {
    accessType: 'keystore',
    keystore: '',
    password: ''
  },

  start: async function () {
    const walletFromSession = sessionStorage.getItem('walletInstance');
    if (walletFromSession) {
      try {
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession));
        this.changeUI(JSON.parse(walletFromSession));
      } catch (e) {
        sessionStorage.removeItem('walletInstance');
      }
    }
  },

  initContract: async function () {
    var spinner = this.showSpinner();

    // var workerAddr = $('#workerAddr').val(); // 계약 할 대상의 주소를 입력받음
    var startDate = $('#startDate').val(); // 계약 시작 (~부터)
    var workContent = $('#workContent').val(); // 업무 내용
    var startTime = $('#workStartTime').val(); // 오픈 시간
    var endTime = $('#workEndTime').val(); // 마감 시간
    var workWeek = $('#workWeek').val(); // 주 N일 근무
    var salary = $('#salary').val();     // 시급
    var salaryDay = $('#salaryDay').val(); // 근로자 시간

    const id = (await WorkContract.methods.getLatestIndex().call());

    try {
      WorkContract.methods.initWorkContract(
        id,
        // workerAddr,
        startDate,
        workContent,
        startTime,
        endTime,
        caver.utils.toBN(workWeek),
        caver.utils.toBN(salary),
        caver.utils.toBN(salaryDay)
      ).send({
        from: this.getWallet().address,
        gas: '500000',
      }).then(function (result) {
        console.log(result);
        alert('계약서 작성완료!');
        location.reload();
      })
    } catch (err) {
      console.log(err);
    }
    spinner.stop();
  },

  cancelContract: async function () { // 에러 고쳐야함.
    var spinner = this.showSpinner();
    const id = (await WorkContract.methods.getLatestIndex().call());
    try {
      WorkContract.methods.cancelContract(id).send({
        from: this.getWallet().address,
        gas: '400000',
      }).then(function (result) {
        console.log(result);
        alert('계약이 성공적으로 취소되었습니다.');
        location.reload();
      });
    } catch(err) {
      console.log(err);
    }
    spinner.stop();
  },

  completeContract: async function () {
    var spinner = this.showSpinner();
    const id = (await WorkContract.methods.getLatestIndex().call());

    try {
      WorkContract.methods.completeWorkContract(id).send({
        from: this.getWallet().address,
        gas: '200000',
      }).then(function (result) {
        console.log(result);
        alert("계약이 완료되었습니다!");
        location.reload();
      })
    } catch (err) {
      alert("고용주가 완료할 수 없습니다");
      console.log(err);
    }
    spinner.stop();
  },

  // 다루는 부분

  handleImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = (event) => {
      try {
        if (!this.checkValidKeystore(event.target.result)) { // 키스토어 파일이 유효하지 않으면 "Invalid Keystore file."
          $('#message').text('유효하지 않은 keystore 파일입니다.'); // id가 message인 곳에 텍스트를 뿌린다.
          return;
        }
        // 키스토어 파일이 유효하다면
        this.auth.keystore = event.target.result;
        $('#message').text('keystore 일치. 비밀번호를 입력하세요.');
        document.querySelector('#input-password').focus();
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
        return;
      }
    }
  },

  handlePassword: async function () {
    this.auth.password = event.target.value;
  },

  handleLogin: async function () {
    if (this.auth.accessType === 'keystore') {
      try {
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey;
        this.integrateWallet(privateKey);
      } catch (e) {
        $('#message').text('비밀번호가 일치하지 않습니다.');
      }
    }
  },

  handleLogout: async function () {
    this.removeWallet();
    location.reload();
  },

  // 이전 예제 문제 관련 함수 참고만 할 것

  loadHalfCompleted: async function () {
    const length = await WorkContract.methods.getLatestIndex().call();
    var half = $('#half');
    var modal = $('#halfInfoModal');

    for (var index = 0; index <= length; index++) {
      var status = await WorkContract.methods.getStatus(index).call();
      var bol = true;//await WorkContract.methods.isMyHalfContract(index).call();
      if ((status != 0 ) && (status == 1) && bol) {
        const contractInfo = await WorkContract.methods.getWorkContractInfo(index).call();
        modal.find('#employerAddrW').text((await WorkContract.methods.getEmployerAddress(index).call()));
        modal.find('#startDateW').text(contractInfo[0]);
        modal.find('#workContentW').text(contractInfo[1]);
        modal.find('#workStartTimeW').text(contractInfo[2]);
        modal.find('#workEndTimeW').text(contractInfo[3]);
        modal.find('#workWeekW').text(contractInfo[4]);
        modal.find('#salaryW').text(contractInfo[5]);
        modal.find('#salaryDayW').text(contractInfo[6]);
        half.append(modal.html());
      }
    }
  },

  loadFullCompleted: async function () { // 완성된 계약서 정보를 필터링 해서 보여주는 부분
    const length = await WorkContract.methods.getLatestIndex().call();  // 
    var full = $('#full');
    var modal = $('#fullInfoModal');

    for (var index = 0; index <= length; index++) {
      var status = await WorkContract.methods.getStatus(index).call();
      var bol = true; // await WorkContract.methods.isMyFullContract(index).call();
      if ((status != 0 ) && (status == 2) && bol) {
        const contractInfo = await WorkContract.methods.getWorkContractInfo(index).call();
        modal.find('#employerAddrC').text((await WorkContract.methods.getEmployerAddress(index).call()));
        modal.find('#workerAddrC').text((await WorkContract.methods.getWorkerAddress(index).call()));
        modal.find('#startDateC').text(contractInfo[0]);
        modal.find('#workContentC').text(contractInfo[1]);
        modal.find('#workStartTimeC').text(contractInfo[2]);
        modal.find('#workEndTimeC').text(contractInfo[3]);
        modal.find('#workWeekC').text(contractInfo[4]);
        modal.find('#salaryC').text(contractInfo[5]);
        modal.find('#salaryDayC').text(contractInfo[6]);
        full.append(modal.html());
      }
    }
  },

  // ★ 초 중요한 지갑 관련 함수들 - 지갑 인스턴스 가져오기, 지갑파일 맞는지 검사하기, 지갑 통합하기.

  getWallet: function () {
    if (cav.klay.accounts.wallet.length) {
      return cav.klay.accounts.wallet[0];
    }
  },

  checkValidKeystore: function (keystore) {
    const parsedKeystore = JSON.parse(keystore);
    const isValidKeystore = parsedKeystore.version &&
      parsedKeystore.id &&
      parsedKeystore.address &&
      parsedKeystore.keyring;

    return isValidKeystore;
  },

  integrateWallet: function (privateKey) {
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey);
    cav.klay.accounts.wallet.add(walletInstance);
    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance));
    this.changeUI(walletInstance);
  },

  reset: function () {
    this.auth = {
      keystore: '',
      password: ''
    };
  },

  removeWallet: function () {
    cav.klay.accounts.wallet.clear();
    sessionStorage.removeItem('walletInstance');
    this.reset();
  },
  // 지갑 관련 함수 끝자락


  // 스피너 관련 함수
  showTimer: function () {
    var seconds = 3;
    $('#timer').text(seconds);

    var interval = setInterval(() => {
      $('#timer').text(--seconds);
      if (seconds <= 0) {
        $('#timer').text('');
        $('#answer').val('');
        $('#question').hide();
        $('#start').show();
        clearInterval(interval);
      }
    }, 1000);
  },

  showSpinner: function () {
    var target = document.getElementById("spin");
    return new Spinner(opts).spin(target);
  },

  // 화면 변경 해주는 함수 
  changeUI: async function (walletInstance) {
    $('#loginModal').modal('hide'); // 로그인창 사라짐.
    $('#login').hide();             // 로그인 버튼 사라짐.
    $('#logout').show();            // 로그아웃 버튼 보여줌.
    $('#contractContent').show();   // 계약내역창 보여줌.
    $('#Myaddress').append('<br>' + '<p>' + '내 계정 주소 : ' + walletInstance.address + '</p>');   // 계정정보를 추가함 (html에서는 빈 div태그)
    $('#transaction').append(`<p><a href='https://baobab.klaytnscope.com' target='_blank'>트랜젝션 확인(scope)</a></p>`); 

    console.log(walletInstance.address);

    WorkContract.methods.getLatestIndex().call().then(function (index) {
      console.log(index);
    });

    if ((await this.callOwner()).toUpperCase() === walletInstance.address.toUpperCase()) {   // 
      $('#owner').show();
    }
    this.loadHalfCompleted();
    this.loadFullCompleted();
  },

  callOwner: async function () {
    return await WorkContract.methods.owner().call();
  },

  callContractBalance: async function () {
    return await WorkContract.methods.getBalance().call();
  },

}; // App 객체 설계 끝

// 시작하는 부분

window.App = App;

window.addEventListener("load", function () {
  App.start();
});

var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};