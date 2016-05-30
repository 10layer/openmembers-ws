'use strict';
var config = require("./config");
var WebSocketServer = require("ws").Server;

var wss = new WebSocketServer({ port: config.port });
wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		client.send(data);
	});
};

console.log("Listening for connections", { port: config.port });

wss.on("connection", function (ws) {

	var sendMessage = function(data, client) {
		client = client || ws;
		client.send(JSON.stringify(data));
	};

	var sendError = function(err, client) {
		client = client || ws;
		client.send(JSON.stringify({ error: err }));
	};

	console.log("Websocket connection");
	ws.rooms = [];
	ws.on("message", function (msg) {
		try {
			msg = JSON.parse(msg);
		} catch (e) {
			console.error({ cause: "JSON.parse(msg)", msg: msg, error: e });
			return;
		}
		console.log(msg);
		if (msg.type == "subscribe") {
			if (!msg.room) {
				sendError("Missing parameters");
			}
			if (Array.isArray(msg.room)) {
				msg.room.forEach(function(room) {
					ws.rooms.push(room);	
				});
			} else {
				ws.rooms.push(msg.room);
			}
			sendMessage({ evt: "Subscribed", room: ws.rooms });
		}
		if (msg.type == "broadcast") {
			wss.clients.forEach(function(client) {
				if (!msg.room) {
					sendError("Missing parameters");
				}
				if (client.rooms.indexOf(msg.room) != -1) {
					// console.log(client);
					sendMessage(msg, client);
				}
			});
		}
	});
	ws.on("close", function () {
		
	});
});