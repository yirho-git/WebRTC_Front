import VChat from "./components/VChat";

function App() {
  const userId = new URLSearchParams(window.location.search).get("userId");

  return (
    <>
    <div>
    <h1>WebRTC 테스트</h1>
    <VChat userId={userId} />
    </div>
    </>
  )
}

export default App
