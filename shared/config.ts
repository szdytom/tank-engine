export default {
    tick_speed: 40, // ms
    tank: {
        speed: 5,
        blood: 100,

        size: 50, // 50x50
        
        crash_damage: 1, // crash wall
        fire_too_much_damage: 15,

        turn_speed: {
            main: 14.8, // degree per tick,
            gun: 56.4,
        },

        damage_blood_rate: 0.2,
    },

    shell: {
        speed: 20.4,
        damage: [1, 20, 25, 75, 98.5],
        heat: [1, 16, 19, 50, 59],
    },

    height: 1000,
    width: 1000,
};