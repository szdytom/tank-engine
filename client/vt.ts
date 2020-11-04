import $ = require('jquery');

let last_id: number;
const clear_message_delay: number = 3500;

function message(x: string) {
    clearTimeout(last_id);
	$('#message').text(x);
    $('#virtual-console').val($('#virtual-console').val() + x + '\n');
    setTimeout(() => {
        $('#message').text(' ');
    }, clear_message_delay);
}

function warn(x: string) {
    console.warn(x);

    x = '[W] ' + x;
    message(x);
}

function info(x: string) {
    console.log(x);

    x = '[I] ' + x;
    message(x);
}

function error(x: string) {
    console.error(x);

    x = '[E] ' + x;
    message(x);
}

function debug(x: any) {
    console.log(x);
    x = JSON.stringify(x);
    $('#virtual-console').val($('#virtual-console').val() + x + '\n');
}

export default {
    info: info,
    warn: warn,
    error: error,
    debug: debug,
};