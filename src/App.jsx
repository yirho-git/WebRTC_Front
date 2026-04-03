import VideoChat from "./components/VideoChat";

function App() {
  const userId = new URLSearchParams(window.location.search).get("userId");

  return (
    <>
    <div>
    <h1>WebRTC 테스트</h1>
    <VideoChat userId={userId} />
    </div>
    </>
  )
}

export default App
