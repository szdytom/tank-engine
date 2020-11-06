const Config = {
    tick_speed: 40,
    max_rooms: 10000,
    space: {
        height: 800,
        width: 1000,
    },
    shells: {
        Tank: {
            speed: 20.48,
            damage: [1, 20, 25, 75, 98.75],
            heat: [1, 16, 19, 50, 59],
        },
    },
    equipments: {
        Tanks: {
            speed: 5,
            blood: 100,
            size: 50,
            crash_wall_damage: 1,
            turn_speed: {
                main: 14.8,
                gun: 56.4,
                radar: 360,
            },
            fire_too_much_damage: 5,
        },
    },
};

export default Config;
