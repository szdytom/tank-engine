import $ = require('jquery');
import io = require('socket.io-client');
import Config from '../shared/config';
import { set_up_control, start_code, update_equipments } from './api';
import game_runtime_info from './global';
import ui from './ui';
import vt from './vt';

let gre = game_runtime_info.get_instance();

function clean_array_null<T>(a: Array<T>) {
	a.forEach((element, id, array) => {
		if (element === null || element === undefined) {
			delete array[id];
		}
	});
}

function start_by_code(code: string) {
	$('#stop-button').removeAttr('disabled');
	$('#start-button').attr('disabled', 'true');

	$('#run-control').css('display', 'block');

	let server_url: string = '/';

	gre.socket = io(server_url, {
		reconnection: false,
		reconnectionAttempts: 0,
	});

	gre.socket.on('connect', function () {
		vt.info('Connected.');

		let can_load_control_code: boolean = false;
		let load_control_code: Promise<void> = new Promise((resolve) => {
			let iid = setInterval(() => {
				if (can_load_control_code) {
					clearInterval(iid);
					resolve();
				}
			}, Config.tick_speed);
		});

		gre.socket.on('update', function (info: { shells: any[], equipments: any[], map: Object }) {
			gre.equipments = info.equipments;
			clean_array_null(gre.equipments);

			gre.shells = info.shells;
			clean_array_null(gre.shells);

			gre.equipments_id_map = info.map;
			can_load_control_code = true;
			ui();
			update_equipments();
		});

		gre.socket.on('equipemt-destory', function () {
			vt.info('Your equipment was destroyed.');
			gre.socket.disconnect();
		});

		let parsed_code = new Function('tk', code);

		start_code(parsed_code, load_control_code);
	});

	gre.socket.on('disconnect', function () {
		vt.warn('Disconnected.');
		on_stop();
	});

	gre.socket.on('connect_error', () => {
		vt.error('Error while connecting to server.');
	});
}

function start() {
	let code: string = $('#code').val().toString();
	if (code.startsWith('http')) {
		// is an URL
		$.get('/webjs', { url: code }, (web_code: string): void => {
			start_by_code(web_code);
		});
	} else {
		start_by_code(code);
	}
}

function stop() {
	gre.socket.disconnect();
	on_stop();
}

function on_stop() {
	$('#stop-button').attr('disabled', 'true');
	$('#code').css('display', 'inline');
}

$(function () {
	console.log('Init');

	$('#run-control').css('display', 'none');

	$('#start-button').on('click', start);
	$('#stop-button').on('click', stop);

	$('#stop-button').attr('disabled', 'true');

	$('#virtual-console').val('');
	set_up_control();

	vt.info('Tank Engine Client (V2.0a4) loaded.');
});