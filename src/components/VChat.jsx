import React, { useEffect, useRef } from 'react'
import { connectSocket, sendMessage } from '../services/socket'
import { createPeerConnection } from '../hooks/useWebRTC'

export default function VChat({ userId }) {
  const socketRef = useRef(null);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const targetIdRef = useRef("user2");
  const pendingOfferRef = useRef(null);

  // 카메라 연결 및 PeerConnection 초기화 (재사용 가능한 함수로 변경)
  const initMediaAndPeerConnection = async () => {
    if (pcRef.current) {
      console.log("📹 이미 PeerConnection 초기화됨");
      return;
    }

    try {
      console.log("📹 ========== 카메라 초기화 시작 ==========");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log("📹 ✅ getUserMedia 성공");
      console.log("📹 stream tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));

      myVideoRef.current.srcObject = stream;
      console.log("📹 ✅ myVideoRef.srcObject 설정");

      // 🪄PeerConnection 생성
      pcRef.current = createPeerConnection(
        (candidate) => {
          console.log("📍 ICE candidate 생성:", candidate?.candidate?.substring(0, 50) + "...");
        
          if(!candidate) {
            console.log("📍 ICE candidate 수집 완료 (null)");
            return;
          }

          sendMessage({
            type: "candidate",
            candidate: {
              candidate : candidate.candidate,
              sdpMid : candidate.sdpMid,
              sdpMLineIndex : candidate.sdpMLineIndex
            },
            to: targetIdRef.current
          })
        },
        (remoteStream) => {
          console.log("🎥 ========== onTrack 콜백 호출됨 ==========");
          console.log("🎥 remoteStream:", remoteStream);
          
          const tracks = remoteStream.getTracks();
          console.log("🎥 remoteStream.getTracks():", tracks);
          console.log("🎥 tracks 개수:", tracks.length);
          
          tracks.forEach((track, idx) => {
            console.log(`🎥 Track ${idx}:`, {
              kind: track.kind,
              enabled: track.enabled,
              readyState: track.readyState
            });
          });

          const video = remoteVideoRef.current;
          if (!video) {
            console.error("🎥 ❌ remoteVideoRef가 없음!");
            return;
          }

          // ⚠️ onTrack이 여러 번 호출될 수 있으므로 이미 srcObject가 설정되어 있으면 스킵
          if (video.srcObject) {
            console.log("🎥 이미 srcObject가 설정됨, 중복 처리 방지");
            return;
          }

          console.log("🎥 중요: video element srcObject 설정 직전");

          // 기존 이벤트 리스너 제거
          video.onloadedmetadata = null;
          video.onloadstart = null;
          video.onerror = null;

          // 모든 video 이벤트 먼저 설정
          video.onerror = (e) => {
            console.error("🎥 video error event:", e);
          };

          video.onloadstart = () => {
            console.log("🎥 loadstart 이벤트");
          };

          video.onloadedmetadata = () => {
            console.log("🎥 ✅ loadedmetadata 이벤트 발생! duration:", video.duration);
            console.log("🎥 video state:", {
              readyState: video.readyState,
              networkState: video.networkState,
              paused: video.paused,
              buffered: video.buffered.length > 0
            });
            
            if (video.paused) {
              console.log("🎥 video.play() 시도");
              video.play()
                .then(() => {
                  console.log("🎥 ✅ 재생 성공!");
                })
                .catch(err => {
                  console.error("🎥 ❌ 재생 실패:", err.name, err.message);
                });
            }
          };

          video.oncanplay = () => {
            console.log("🎥 canplay 이벤트");
          };

          video.onprogress = () => {
            console.log("🎥 progress 이벤트");
          };

          // 이벤트 핸들러 설정 후에 srcObject 설정
          console.log("🎥 remoteStream을 video.srcObject에 할당");
          video.srcObject = remoteStream;

          console.log("🎥 현재 video state:", {
            readyState: video.readyState,
            networkState: video.networkState,
            paused: video.paused
          });
        }
      )

      // onconnectionstatechange 모니터링
      pcRef.current.onconnectionstatechange = () => {
        console.log("🔗 PeerConnection connectionState:", pcRef.current.connectionState);
      };

      // oniceconnectionstatechange 모니터링
      pcRef.current.oniceconnectionstatechange = () => {
        console.log("🔗 PeerConnection iceConnectionState:", pcRef.current.iceConnectionState);
      };

      console.log("🔗 PeerConnection 생성 완료, state:", pcRef.current.connectionState);

      // track 추가 (매우 중요)
      // 내 로컬 카메라/마이크 데이터를 WebRTC 연결(P2P 통로)에 실어 보내는 작업
      // 이전까지는 내 화면에만 내 영상을 보여주고 있었다면(Local),
      // 이제는 상대방에게 내 데이터를 전송할 준비를 하는 것임.
      console.log("📹 stream에서 local tracks를 PeerConnection에 추가");
      stream.getTracks().forEach((track, idx) => {
        console.log(`📹 Track ${idx} 추가: ${track.kind}`);
        pcRef.current.addTrack(track, stream);
      });

      console.log("📹 ✅ PeerConnection 및 track 준비 완료");

      // 대기 중인 offer가 있으면 처리
      if (pendingOfferRef.current) {
        console.log("📹 대기 중인 offer 발견 → 처리 시작");
        await processOffer(pendingOfferRef.current);
        pendingOfferRef.current = null;
      }

    } catch (err) {
      console.error("📹 ❌ 카메라 초기화 에러:", err);
    }
  };

  // Offer 처리 함수
  const processOffer = async (data) => {
    console.log("📩 ========== offer 처리 시작 ==========");
    console.log("📩 from:", data.from);
    console.log("📩 PC state:", pcRef.current.connectionState);
    
    targetIdRef.current = data.from;

    try {
      // 상대 offer 적용
      console.log("📩 setRemoteDescription(offer) 호출");
      await pcRef.current.setRemoteDescription({
        type: "offer",
        sdp: data.sdp
      });
      console.log("📩 ✅ setRemoteDescription 완료");

      // answer 생성
      console.log("📩 createAnswer() 호출");
      const answer = await pcRef.current.createAnswer();
      console.log("📩 ✅ answer 생성 완료");

      // 내 상태 설정
      console.log("📩 setLocalDescription(answer) 호출");
      await pcRef.current.setLocalDescription(answer);
      console.log("📩 ✅ setLocalDescription 완료");

      // 상대에게 전송
      console.log("📩 answer를 상대에게 전송");
      sendMessage({
        type: "answer",
        sdp : answer.sdp,
        to: data.from
      });
      console.log("📩 ✅ answer 전송 완료");
    } catch (err) {
      console.error("📩 ❌ offer 처리 에러:", err);
    }
  };

  // 웹소켓 연결
  useEffect(() => {
    socketRef.current = connectSocket(userId, async (data) => {
      console.log(`📨 [${data.type?.toUpperCase()}] 메시지 수신:`, data);

      // 1. offer를 받았을 때
      if (data.type === "offer") {
        console.log("📨 ========== OFFER 수신 ==========");
        
        // PeerConnection이 아직 없으면 먼저 초기화
        if (!pcRef.current) {
          console.log("📨 pcRef가 없어서 카메라 초기화 + offer 처리");
          pendingOfferRef.current = data;
          await initMediaAndPeerConnection();
          return;
        }

        console.log("📨 pcRef 있음, offer 처리");
        await processOffer(data);

      } else if (data.type === "answer") {
        console.log("📨 ========== ANSWER 수신 ==========");

        if (pcRef.current) {
          console.log("📨 setRemoteDescription(answer) 호출");
          await pcRef.current.setRemoteDescription({
            type: "answer",
            sdp: data.sdp
          });
          console.log("📨 ✅ setRemoteDescription 완료");
        } else {
          console.error("📨 ❌ pcRef가 없음!");
        }

      } else if (data.type === "candidate") {
        console.log("📨 ========== ICE CANDIDATE 수신 ==========");
       
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log("📨 ✅ ICE candidate 추가 완료");
          } catch (err) {
            console.error("📨 ❌ ICE candidate 추가 실패:", err);
          }
        } else {
          console.log("📨 remoteDescription 아직 없음 → candidate 대기");
        }
      }
    });
  }, [userId]);

  // 컴포넌트 마운트 시 카메라 초기화
  useEffect(() => {
    console.log("⚙️ VChat 컴포넌트 마운트됨");
    initMediaAndPeerConnection();
  }, []);

  /**
   * 연결 요청 프로세스
   *  연결 제안서 -> 내 상태 등록 -> 상대에게 보낸다
   */
  const createOffer = async () => {
    console.log("📤 ========== 통화 시작 (createOffer) ==========");
    targetIdRef.current = "user2";
    
    if (!pcRef.current) {
      console.error("📤 ❌ pcRef.current가 없음!");
      return;
    }

    try {
      console.log("📤 createOffer() 호출");
      const offer = await pcRef.current.createOffer();
      console.log("📤 ✅ offer 생성 완료");

      console.log("📤 setLocalDescription(offer) 호출");
      await pcRef.current.setLocalDescription(offer);
      console.log("📤 ✅ setLocalDescription 완료, PC state:", pcRef.current.signalingState);

      console.log("📤 offer를 user2에게 전송");
      sendMessage({
        type: "offer",
        sdp: offer.sdp,
        to: "user2"
      });
      console.log("📤 ✅ offer 전송 완료");
    } catch (err) {
      console.error("📤 ❌ offer 생성 에러:", err);
    }
  }

    /**
       * RTCPeerConnection브라우저 내장 클래스 객체의 createOffer() 메서드
       *  createOffer()를 호출 시 브라우저가 알아서 내 설정환경 등을 탐색하고
       *  그 정보를 담아 보낼 수 있게 준비한다.
       *  # 설정환경등에 대해 깊게 알 필요 없음
       *  (아주 극히 특수한 경우가 아니면설정환경을 바꾸거나 하지않는게 국룰)
       */

  return (
    <>
      <div>
        <h2>VChat</h2>
        <p>내 userId: {userId}</p>

        <video ref={myVideoRef}
          autoPlay
          playsInline
          muted
          controls
          width={"300"} />
        <button onClick={createOffer}>통화 시작</button>

        <video ref={remoteVideoRef}
          playsInline
          width={"300"}
          style={{ border: '2px solid blue', backgroundColor: '#000' }} />
      </div>
    </>
  )
}