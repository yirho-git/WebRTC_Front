import { useEffect } from "react";
import { connectSocket } from "../services/socket";
import useWebRTC from "../hooks/useWebRTC";

function ChatPage() {

  const {
    startCamera,
    createPeer,
    createAnswer,
    setRemote,
    addCandidate
  } = useWebRTC();

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");

    if(!userId) {
      alert("userId 필요 (ex: ?userId=user1");
      return;
    }

    connectSocket("user1", async (data) => {

      switch (data.type) {

        case "offer":
          await startCamera();

          createPeer(data.from, (stream) => {
            document.querySelector("#remoteVideo").srcObject = stream;
          });

          await setRemote(data.sdp);
          await createAnswer(data.from);
          break;

        case "answer":
          await setRemote(data.sdp);
          break;

        case "candidate":
          await addCandidate(data.candidate);
          break;
      }

    });
  }, []);

  return <div id="remoteVideo"></div>;
}

export default ChatPage;