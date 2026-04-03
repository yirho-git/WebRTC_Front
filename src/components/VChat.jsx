import React, { useEffect, useRef } from 'react'
import { connectSocket, sendMessage } from '../services/socket'
import { createPeerConnection } from '../hooks/useWebRTC'

export default function VChat({ userId }) {
  const socketRef = useRef(null); // 소켓을 담을 ref생성 (소켓은 지속적으로 내부데이터가 변화하기 때문에 렌더링에 영향주지않는 ref로 담음)
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null); // peerConnection(상대방과 연결 통로) 담을 ref 생성
  const targetIdRef = useRef("user2");

  // 웹소켓 연결
  useEffect(() => {
    socketRef.current = connectSocket(userId, async (data) => {   // socketRef의 참조값을 connectSocket()의 리턴값으로 참조
      console.log("받은 메세지: ", data);   // ws.onmessage(메시지 수신시 이벤트가) 실행될 때 이 로그가 찍힘!!

      // 1. offer를 받았을 때
      if (data.type === "offer") {  // 수신한 메시지의 {type : offer} 인 경우
        console.log("offer 받음");
        targetIdRef.current = data.from;
        // 상대 offer 적용
        await pcRef.current.setRemoteDescription(data.offer); // offer의 설정 상태 등록

        // answer
        const answer = await pcRef.current.createAnswer();  // 응답 받을 설정 환경 담기 

        // 내 상태 설정
        await pcRef.current.setLocalDescription(answer);  // 응답가능한 상태로 변경

        console.log("answer 생성: ", answer);

        // 상대에게 전송
        sendMessage({
          type: "answer",
          answer,
          to: data.from   // ⚠️서버에서 from 필드 필요
        });
      }else  if(data.type === "answer"){    // 응답(answer)을 받았을 때
        console.log("answer 받음");

        // 상대 answer 적용
        await pcRef.current.setRemoteDescription(data.answer);
      }else if(data.type === "candidate"){
        console.log("candidate 받음");

        await pcRef.current.addIceCandidate(data.candidate);
      }
    });
  }, [userId]);  // userId가 바뀌면 리렌더링

  // 카메라 연결 및 렌더링
  useEffect(() => {
    // 카메라 연결 
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        myVideoRef.current.srcObject = stream;

        // 🪄PeerConnection 생성
        pcRef.current = createPeerConnection(
          (candidate) => {
            console.log("ICE: ", candidate);  // onIceCandidate 콜백함수 실행시 리턴값 로그
            sendMessage({
              type : "candidate",
              candidate,  // 연결 가능한 ICE 후보 정보
              to : targetIdRef.current // 상대 ID
            })
          },
          (remoteStream) => {
            console.log("remote stream: ", remoteStream)   // onTrack 콜백함수 리턴값 로그
            remoteVideoRef.current.srcObject = remoteStream;
          }
        )

        // track 추가 (매우 중요)
        // 내 로컬 카메라/마이크 데이터를 WebRTC 연결(P2P 통로)에 실어 보내는 작업
        // 이전까지는 내 화면에만 내 영상을 보여주고 있었다면(Local),
        // 이제는 상대방에게 내 데이터를 전송할 준비를 하는 것임.
        stream.getTracks().forEach(track => {
          pcRef.current.addTrack(track, stream);
        });

      } catch (err) {
        console.log(err);
      }
    }

    initMedia();
  }, []);

  /**
   * 연결 요청 프로세스
   *  연결 제안서 -> 내 상태 등록 -> 상대에게 보낸다
   */
  const createOffer = async () => {
    import React, { useEffect, useRef } from 'react'
import { connectSocket, sendMessage } from '../services/socket'
import { createPeerConnection } from '../hooks/useWebRTC'

export default function VChat({ userId }) {
  const socketRef = useRef(null); // 소켓을 담을 ref생성 (소켓은 지속적으로 내부데이터가 변화하기 때문에 렌더링에 영향주지않는 ref로 담음)
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null); // peerConnection(상대방과 연결 통로) 담을 ref 생성
  const targetIdRef = useRef("user2");

  // 웹소켓 연결
  useEffect(() => {
    socketRef.current = connectSocket(userId, async (data) => {   // socketRef의 참조값을 connectSocket()의 리턴값으로 참조
      console.log("받은 메세지: ", data);   // ws.onmessage(메시지 수신시 이벤트가) 실행될 때 이 로그가 찍힘!!

      // 1. offer를 받았을 때
      if (data.type === "offer") {  // 수신한 메시지의 {type : offer} 인 경우
        console.log("offer 받음");
        targetIdRef.current = data.from;
        // 상대 offer 적용
        await pcRef.current.setRemoteDescription(data.offer); // offer의 설정 상태 등록

        // answer
        const answer = await pcRef.current.createAnswer();  // 응답 받을 설정 환경 담기 

        // 내 상태 설정
        await pcRef.current.setLocalDescription(answer);  // 응답가능한 상태로 변경

        console.log("answer 생성: ", answer);

        // 상대에게 전송
        sendMessage({
          type: "answer",
          answer,
          to: data.from   // ⚠️서버에서 from 필드 필요
        });
      }else  if(data.type === "answer"){    // 응답(answer)을 받았을 때
        console.log("answer 받음");

        // 상대 answer 적용
        await pcRef.current.setRemoteDescription(data.answer);
      }else if(data.type === "candidate"){
        console.log("candidate 받음");

        await pcRef.current.addIceCandidate(data.candidate);
      }
    });
  }, [userId]);  // userId가 바뀌면 리렌더링

  // 카메라 연결 및 렌더링
  useEffect(() => {
    // 카메라 연결 
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        myVideoRef.current.srcObject = stream;

        // 🪄PeerConnection 생성
        pcRef.current = createPeerConnection(
          (candidate) => {
            console.log("ICE: ", candidate);  // onIceCandidate 콜백함수 실행시 리턴값 로그
            sendMessage({
              type : "candidate",
              candidate,  // 연결 가능한 ICE 후보 정보
              to : targetIdRef.current // 상대 ID
            })
          },
          (remoteStream) => {
            console.log("remote stream: ", remoteStream)   // onTrack 콜백함수 리턴값 로그
            remoteVideoRef.current.srcObject = remoteStream;
          }
        )

        // track 추가 (매우 중요)
        // 내 로컬 카메라/마이크 데이터를 WebRTC 연결(P2P 통로)에 실어 보내는 작업
        // 이전까지는 내 화면에만 내 영상을 보여주고 있었다면(Local),
        // 이제는 상대방에게 내 데이터를 전송할 준비를 하는 것임.
        stream.getTracks().forEach(track => {
          pcRef.current.addTrack(track, stream);
        });

      } catch (err) {
        console.log(err);
      }
    }

    initMedia();
  }, []);

  /**
   * 연결 요청 프로세스
   *  연결 제안서 -> 내 상태 등록 -> 상대에게 보낸다
   */
  const createOffer = async () => {
    try {
      /**
       * RTCPeerConnection브라우저 내장 클래스 객체의 createOffer() 메서드
       *  createOffer()를 호출 시 브라우저가 알아서 내 설정환경 등을 탐색하고
       *  그 정보를 담아 보낼 수 있게 준비한다.
       *  # 설정환경등에 대해 깊게 알 필요 없음
       *  (아주 극히 특수한 경우가 아니면설정환경을 바꾸거나 하지않는게 국룰)
       */
      const offer = await pcRef.current.createOffer();  // 내 설정환경 담아 준비 

      await pcRef.current.setLocalDescription(offer);   // 위에 준비한 설정환경을 내 브라우저에 등록
      // WebRTC 연결 상태 : stable -> have-local-offer (offer상태 = 내가 먼저 연결을 요청한 상태)
      // 상대가 연결을 받으면 : have-local-offer -> stable
      // 추가로 offer 상태에서는 ICE후보들을 계속 생성하며 기다림
      console.log("offer 생성 : ", offer);
      /*
        상대입장 
          1. 내가 offer(연결요청)
          2. 상대는 offer 수신
          3. 상대 상태 : stable -> have-remote-offer (offer 수신할 준비됨)
      */
     
      sendMessage({   // 상대에게 전달 (offer : offer => 내 설정환경을 전달)
        type: "offer",
        offer,
        to: "user2"  // 테스트용 (상대 ID)
      });
    } catch (err) {
      console.error("offer 생성 에러 : ", err);
    }
  }

  return (
    <>
      <div>
        <h2>VChat</h2>
        <p>내 userId: {userId}</p>

        <video ref={myVideoRef}
          autoPlay
          playsInline
          muted
          width={"300"} />
        <button onClick={createOffer}>통화 시작</button>
        <video ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          width={"300"} />
        <button onClick={createOffer}>통화 시작</button>
      </div>
    </>
  )
}
    try {
      /**
       * RTCPeerConnection브라우저 내장 클래스 객체의 createOffer() 메서드
       *  createOffer()를 호출 시 브라우저가 알아서 내 설정환경 등을 탐색하고
       *  그 정보를 담아 보낼 수 있게 준비한다.
       *  # 설정환경등에 대해 깊게 알 필요 없음
       *  (아주 극히 특수한 경우가 아니면설정환경을 바꾸거나 하지않는게 국룰)
       */
      const offer = await pcRef.current.createOffer();  // 내 설정환경 담아 준비 

      await pcRef.current.setLocalDescription(offer);   // 위에 준비한 설정환경을 내 브라우저에 등록
      // WebRTC 연결 상태 : stable -> have-local-offer (offer상태 = 내가 먼저 연결을 요청한 상태)
      // 상대가 연결을 받으면 : have-local-offer -> stable
      // 추가로 offer 상태에서는 ICE후보들을 계속 생성하며 기다림
      console.log("offer 생성 : ", offer);
      /*
        상대입장 
          1. 내가 offer(연결요청)
          2. 상대는 offer 수신
          3. 상대 상태 : stable -> have-remote-offer (offer 수신할 준비됨)
      */
     
      sendMessage({   // 상대에게 전달 (offer : offer => 내 설정환경을 전달)
        type: "offer",
        offer,
        to: "user2"  // 테스트용 (상대 ID)
      });
    } catch (err) {
      console.error("offer 생성 에러 : ", err);
    }
  }

  return (
    <>
      <div>
        <h2>VChat</h2>
        <p>내 userId: {userId}</p>

        <video ref={myVideoRef}
          autoPlay
          playsInline
          muted
          width={"300"} />
        <button onClick={createOffer}>통화 시작</button>
        <video ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          width={"300"} />
        <button onClick={createOffer}>통화 시작</button>
      </div>
    </>
  )
}