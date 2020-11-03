import Position from './positions'

interface Tank {
    pos: Position,
    blood: number,
    name: string,
    time_to_fire: number,
    tank_dire: number,
    gun_dire: number,
    radar_dire: number,
    is_moving: boolean,
    id: string,
}

export default Tank;