// SPDX-License-Identifier: MIT
pragma solidity >= 0.4.24 <= 0.5.6;

/// @title 근로계약서 스마트 컨트랙트
contract Work {
    
    address public owner;                   // 컨트랙트 배포한 사람 주소 <<- 운영자
    uint public latestIndex = 0;           // 체결된 전체 근로계약서 개수(길이)
    
    struct WorkContract { // @dev 표준 근로계약서 기반 순서로 타입 선언(중구난방 주의)
        
        address employerAddress;            // 고용주의 주소 << 고용주가 쓰는 함수 실행할때 msg.sender로 저장.
        address workerAddress;              // 근로자의 주소 << 근로자가 쓰는 함수 실행할때 msg.sender로 저장.
        
        string startDate;                   // 계약기간(시작) << 고용주 입력값, (끝)은 없는 상태로 시작.
        string workContent;                 // 업무 내용  << 고용주 입력값

        string startTime;                     // 근로시간(시작)   << 고용주 입력값
        string endTime;                       // 근로시간(끝)     << 고용주 입력값
        
        uint salary;                      // 시급             << 고용주 입력값
        uint8 workingDays;                  // 주 N일 근무      << 고용주 입력값 순서는 일부로 바꿈(salary <=> )
        uint8 salaryDay;                    // 월급날
        
        //string empSign;                    // 고용주 싸인
        //string workSign;                    // 근로자 싸인
        
        uint8 status;                       
        // 0 - 계약없는상태 (선언 기본값 )
        // 1 - 고용자가작성함
        // 2 - 근로자가 서명함.
    }
    
    mapping (uint => WorkContract) public workContract;

    constructor() public { // 배포할때 딱 한번 실행, 배포한 사람의 주소가 이 스마트 컨트랙트의 owner로 지정.
        owner = msg.sender; 
    }
    
    // event SucceedWorkContract(address _empAddr,address _worAddr); // 이벤트, 나중에 함수 내에 인자값 받아넣고 console.log용으로 사용예정.
    
    // 고용주가 근로계약서를 생성하는 부분 
    function initWorkContract(uint _id,
        // address _workerAddress,
        string memory _startDate,         // 계약기간(시작) *근무장소 제외*
        string memory _workContent,    // 업무 내용
        string memory _startTime,         // 근로시간(시작)               
        string memory _endTime,           // 근로시간(끝)
        uint8 _workingDays,      // 주 N일              
        uint24 _salary,        // 시급(월급)
        uint8 _salaryDay
        ) public returns (bool) {
            WorkContract storage wc = workContract[_id]; // _id의 키값을 가진 빈 계약서에 내용 대입, memory에서 바뀌야 할지도
            
            wc.employerAddress = msg.sender;
            // wc.workerAddress = _workerAddress;
            
            wc.startDate = _startDate;
            wc.workContent = _workContent;
            wc.startTime = _startTime;
            wc.endTime = _endTime;
            wc.workingDays = _workingDays;
            wc.salary = _salary;
            wc.salaryDay = _salaryDay;
            wc.status = 1;
            
            //latestIndex++; // 근로계약서 작성 - 저장시 바로 인덱스를 올려버린다. 이걸로 인덱스를 올릴 시 근로자가 인덱스를 올린값으로 받아야함. 
            
            return true;
    }
    
    // 근로자가 '진행중인 근로계약서'를 받아서, 마저 기입하고 완료하면서 실행되는 함수.
    function completeWorkContract(uint _id) public returns (bool) {
            require(workContract[_id].employerAddress != msg.sender);
            WorkContract storage wc = workContract[_id];
            wc.workerAddress = msg.sender;          // 실행한 사람의 주소를 계약서의 근로자 주소로 입력
            wc.status = 2;
            
            latestIndex++; // 근로계약서 완성 - 완성시 인덱스를 올린다. 한명씩 근로계약서를 작성할때는 맞지만 여러명이 동시에 작성하면 인덱스에 문제가 있을 수 있다.
            return true;
    }
    
    // 고용주와 근로자가 계약서 보고 취소할 수도 있도록 하는 함수 ( 자기가 잘못 쓸 수도 있으니 )
    function cancelContract(uint8 _id) public returns (bool) {
        require(workContract[_id].workerAddress == msg.sender || workContract[_id].employerAddress == msg.sender );
        delete workContract[_id];
        return true;
    }

    /// @dev 반환하는데에 스택 공간이 부족해질 수 있음
    function getWorkContractInfo(uint _id) view public
    returns (
        string memory startDate,
        string memory workContent,
        string memory startTime,
        string memory endTime,
        uint8 workingDays,            
        uint salary,  
        uint8 salaryDay
        )  {
        return (
            workContract[_id].startDate,
            workContract[_id].workContent,
            workContract[_id].startTime,
            workContract[_id].endTime,
            workContract[_id].workingDays,
            workContract[_id].salary,
            workContract[_id].salaryDay
            );
    }
    
    function getEmployerAddress(uint _id) view public returns (address) {
        return workContract[_id].employerAddress;
    }
    
    function getWorkerAddress(uint _id) view public returns (address) {
        return workContract[_id].workerAddress;
    }
    
     // 해당 계약서(인덱스)의 상태변수인 status 값을 받아오는 함수
    function getStatus(uint _id) view public returns (uint8) {
        return workContract[_id].status;
    }
    
    // 근로자가 출력하는 계약서들중에서 status값이 1이고(진행중) 그 계약서 대상이 자기 주소인지를 확인하는 함수.
    // 해당사항이면 계약정보를 보여줘야함.
    function checkWorkerContract(uint _id) view public returns (bool) {
        if( getStatus(_id) == 1 && workContract[_id].workerAddress == msg.sender) {
            return true;
        }
        return false;
    }
    
    // 함수 실행한 사람이 본인들인지 체크하는 함수 (프론트단에서 반복문 돌릴때)
    function isMyHalfContract(uint _id) view public returns (bool) { 
        WorkContract memory con = workContract[_id];
        return ((con.employerAddress == msg.sender || con.workerAddress == msg.sender) && (getStatus(_id) == 1)); // 여기서 true면 계약정보가 보이게끔.
    }

    function isMyFullContract(uint _id) view public returns (bool) { 
        WorkContract memory con = workContract[_id];
        return ((con.employerAddress == msg.sender || con.workerAddress == msg.sender) && (getStatus(_id) == 2)); // 여기서 true면 계약정보가 보이게끔.
    }
    
    function getLatestIndex() view public returns (uint) { // WorkContract[] 구조체 배열의 길이를 반환
        return latestIndex;
    }

    function getBalance() public view returns (uint) { // 함수 실행한 계정 주소의 돈을 반환함.
        return address(msg.sender).balance;
    }
}