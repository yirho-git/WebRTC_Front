export default function useWebRTC() {

}

// 상대방과 통신 통로(RTCPeerConnection) 생성 및 환경 설정
export function createPeerConnection(onIceCandidate, onTrack) {
  const pc = new RTCPeerConnection({  // RTCPeerConnection :: 브라우저 내장 클래스
    iceServers: [  // RTCPeerConnection의 속성 :: iceServer
      { urls: "stun:stun.l.google.com:19302" }  // 내 공인 IP주소 가져오기 (cmd ipconfig로 보여지는 ip는 사설ip다)
    ],
  });
  /*
    ICE(:: Interactive Connectivity Establishment)
      => 연결 가능한 방법을 찾는 과정
        ICE후보
          1. 내부 IP (host)
          2. 공인 IP (srflx)
          3. NAT
          4. TURN 서버 경유 (relay)
      => 위 순서는 연결 선호도 순이며 가능한 모든 네트워크 경로 조합을 동시에 시도한다.
         제일 먼저 성공한 연결을 사용.
         *조합 : 내후보 * 상대후보 = 연결시도
  */
  // ICE후보들 중 연결 가능한 IP로 연결한다
  pc.onicecandidate = (event) => {    
    if (event.candidate) {  // 연결이 성공시
      onIceCandidate(event.candidate);  // onIceCandidate 콜백함수 실행
    }
  };
  /*
    ontrack :: 상대방 영상/오디오가 도착했을 때 실행되는 이벤트
    <조건>
    1. 상대가 ontrack() 실행
    2. offer/answer 교환 완료
    3. ICE 연결 성공
    위 3가지 조건이 "모두 만족" 되어야 실행
  */
  pc.ontrack = (event) => {   // 상대 영상/오디오 데이터가 오면
    console.log("ontrack() 이벤트 실행...!")
    onTrack(event.streams[0]);    // onTrack 콜백함수 실행
  };

  return pc;  // RTCPeerConnection연결을 관리할 준비가 된 설정상태의 객체상태 반환
}