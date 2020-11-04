import $ = require('jquery');
import io = require('socket.io-client');
import ui from './ui';
import Config from '../shared/config';
import { set_up, start_code, update_tanks } from './api';
import { bullets, set_bullets, set_socket, set_tanks, tanks, socket } from './global';
import Tank from '../shared/tanks';
import Bullet from '../shared/bullet';
import vt from './vt';

function start_by_code(code: string) {
	$('#stop-button').removeAttr('disabled');
	$('#start-button').attr('disabled', 'true');

	$('#run-control').css('display', 'block');

	let server_url: string = '/';
	let code_loaded: boolean = false;
	let load_tank_code = new Promise((resolve) => {
		let iid = setInterval(() => {
			if (code_loaded) {
				clearInterval(iid);
				resolve(void(0));
			}
		}, Config.game.update)
	});

	set_socket(io(server_url));
	socket.on('connection', function () {
		vt.info('Connected.');
	});

	socket.on('disconnect', function () {
		vt.info('Disconnected. You are killed.');
		on_stop();
	});

	socket.on('update', function (info: {tanks: Tank[], bullets: Bullet[]}) {
		set_tanks(info.tanks);
		set_bullets(info.bullets);
		ui();
		update_tanks();
		code_loaded = true;
	});

	let parsed_code = new Function('tk', '$', code);
	load_tank_code.then(() => {
		vt.info('Tank control codes loaded.');
		start_code(parsed_code);
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
				vt.info('Remote code downloaded.');
				start_by_code(remote_code);
			})
			.catch(function () {
				vt.error('Error when downloading the remote code.')
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
	$('#code').css('display', 'inline');
}

$(function () {
	console.log("Init");

	$('#run-control').css('display', 'none');
	
	$('#start-button').on('click', start);
	$('#stop-button').on('click', stop);
	
	$('#stop-button').attr("disabled", "true");
	
	$('#virtual-console').val('');
	set_up();

	vt.info('Client loaded. (V1.3b2)');
});