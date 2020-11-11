import 'socket.io-client';

class game_runtime_info {
    private static instance: game_runtime_info
    shells: any[];
    equipments: any[];
    socket: SocketIOClient.Socket;
    equipments_id_map: Object;

    get_equipment(id: string): any {
        return this.equipments[this.equipments_id_map[id]];
    }

    private constructor() { }

    static get_instance(): game_runtime_info {
        if (!this.instance) {
            this.instance = new game_runtime_info();
        }

        return this.instance;
    }
}

export default game_runtime_info;