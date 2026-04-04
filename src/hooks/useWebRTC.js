export default function useWebRTC() {

}

// 상대방과 통신 통로(RTCPeerConnection) 생성 및 환경 설정
export function createPeerConnection(onIceCandidate, onTrack) {
  console.log("🔗 ========== RTCPeerConnection 생성 시작 ==========");
  
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ],
  });

  console.log("🔗 ✅ RTCPeerConnection 객체 생성됨");

  // 연결 후보를 찾는다
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

  // 연결 후보를 찾는다 => 연결 후보를 찾거나 수집완료가 되면 event 실행
  //                   => 연결 후보를 찾으면 event.candidate에 담음
  //                   => 다 뒤져도 연결 후보가 없으면 null을 담음
  // 
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("🔗 onicecandidate 콜백 호출 - candidate 있음");
      onIceCandidate(event.candidate);
    } else {
      console.log("🔗 onicecandidate 콜백 호출 - candidate 없음 (수집 완료)");
      onIceCandidate(null);
    }
  };

  // 상대방 영상/오디오가 도착했을 때
   /*
    ontrack :: 상대방 영상/오디오가 도착했을 때 실행되는 이벤트
    <조건>
    1. 상대가 ontrack() 실행
    2. offer/answer 교환 완료
    3. ICE 연결 성공
    위 3가지 조건이 "모두 만족" 되어야 실행
  */
  pc.ontrack = (event) => {
    console.log("🎬 ontrack() 이벤트 실행...!");
    onTrack(event.streams[0]);
  };

  // 추가 모니터링
  pc.ondatachannel = (event) => {
    console.log("🔗 ondatachannel:", event.channel.label);
  };

  pc.onsignalingstatechange = () => {
    console.log("🔗 signalingState 변경:", pc.signalingState);
  };

  console.log("🔗 ✅ RTCPeerConnection 생성 완료, 반환");
  return pc;
}