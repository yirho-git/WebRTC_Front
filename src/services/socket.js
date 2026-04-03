let ws = null;

export function connectSocket(userId, onMessage){
    ws = new WebSocket(`ws://localhost:7777/ws?userId=${userId}`)

    // ws 연결 성공시 이벤트
    ws.onopen = () => alert("ws connected");

    // 메시지 수신시 이벤트
    ws.onmessage = (e) => {     
        const data = JSON.parse(e.data);
        onMessage(data);
    };

    return ws;
}

export function sendMessage(data){

    if (ws && ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify(data));
    }
}