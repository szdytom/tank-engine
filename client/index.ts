import $ = require('jquery');
import io = require('socket.io-client');
import Tank from '../shared/tanks';
import Bullet from '../shared/bullet';
import ui from './ui';
import Config from '../shared/config';
import { start_code, update_tanks } from './api';

let socket: SocketIOClient.Socket;
let tanks: Array<Tank>;
let bullets: Array<Bullet>;

function message(x: string) {
	$("#message").text(x);
}

function start_by_code(code: string) {
	$("#stop-button").removeAttr("disabled");
	$('#start-button').attr("disabled", "true");

	let s: string = '/';
	let code_loaded: boolean = false;
	let load_tank_code = new Promise((resolve) => {
		let iid = setInterval(() => {
			if (code_loaded) {
				clearInterval(iid);
				resolve();
			}
		}, Config.game.update)
	});

	socket = io(s);
	socket.on('connection', function () {
		message('Connected');
	});

	socket.on('disconnect', function () {
		message('[Disconnect]You are killed.');
		on_stop();
	});

	socket.on('update', function (info) {
		tanks = info.tanks;
		bullets = info.bullets;
		ui(tanks, bullets, socket);
		update_tanks(tanks);
		code_loaded = true;
	});

	let parsed_code = new Function('tk', '$', code);
	load_tank_code.then(() => {
		message('Tank control codes loaded.');
		start_code(parsed_code, tanks, socket);
	});
}

function start() {
	let code: string = $('#code').val().toString();
	if (code.startsWith('http')) {
		// is an URL
		fetch(code)
			.then(function (response) {
				return response.text();
			})
			.then(function (remote_code) {
				message('Remote code downloaded.');
				start_by_code(remote_code);
			})
			.catch(function () {
				message('Error when downloading the remote code.')
			});
	} else {
		start_by_code(code);
	}
}

function stop() {
	socket.disconnect();
	on_stop();
}

function on_stop() {
	$('#stop-button').attr("disabled", "true");
}

$(function () {
	console.log("Init");
	$('#start-button').on('click', start);
	$('#stop-button').on('click', stop);

	$('#stop-button').attr("disabled", "true");
	message('Client loaded.');
});