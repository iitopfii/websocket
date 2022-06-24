const express = require('express');
const app = express();
const server = require('http').Server(app);
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    server: server
});


const clients = {};
const room = [];

// create function  guid 
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}




wss.on('connection', function connection(ws) {
    const clientId = guid();
    clients[clientId] = ws;
    ws.send(JSON.stringify({
        "method": "newClient",
        "clientId": clientId
    }));

    if(room !== {}){
        ws.send(JSON.stringify({
            "method": "create_list_all",
            "data": room
        }));
    }
   
    ws.on('message', function message(data, isBinary) {

        const res = JSON.parse(data);
        if (res.method === "cancel") {
            room = [];
        }
        if (res.method === "create") {
            const roomId = guid();
            const payload = {
                "roomId": roomId,
                "roomName": res.room_name,
                "clientId": clientId,
            }
            room.push( payload);
            payload.method = "create";
            ws.send(JSON.stringify(payload));
        }
        if (res.method === "join") {
            const roomId = res.roomId;
            // find room
            const room_index = room.findIndex(item => item.roomId === roomId);

            if (room[room_index]) {
                const payload = {
                    "method": "join",
                    "clientId": clientId,
                    "roomId": roomId,
                    "room_name": room[room_index].roomName
                }
                ws.send(JSON.stringify(payload));
            }
        }
        if (res.method === "message") {
            const roomId = res.roomId;
            const room_index = room.findIndex(item => item.roomId === roomId);
            if (room[room_index]) {
                const payload = {
                    "method": "message",
                    "clientId": clientId,
                    "roomId": roomId,
                    "message": res.message
                }
                ws.send(JSON.stringify(payload));
            }
        }

        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                if(res.method === "create"){
                    const payload = { data: room}
                    console.log(payload);
                    payload.method = "create_list";
                    if(client.clientId !== clientId){
                        client.send(JSON.stringify(payload));
                    }
                }
                if(res.method === "message"){
                    const payload = { data: res}
                    if(client.clientId !== clientId){
                        payload.method = "message";
                        client.send(JSON.stringify(payload));
                    }

                }
            }
        });
    });
});

app.get('/me', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/', (req, res) => {
    res.send('Hello world');
});

server.listen(4000, () => {
    console.log('Server started on port 4000');
});