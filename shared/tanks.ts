import Position from './positions'

interface Tank {
    pos: Position,
    blood: number,
    name: string,
    time_to_fire: number,
    angle: {
        gun: number,
        radar: number,
        tank: number,
    },
    is_moving: boolean,
    id: string,
}

export default Tank;