---@class HelixHudConfig
Config = {
    framework = 'auto', -- auto-detect or force: 'qbox', 'qbcore', 'esx', 'standalone'

    -- Toggle individual elements
    elements = {
        health = true,
        armor = true,
        hunger = true,
        thirst = true,
        stress = false, -- off by default, not all servers use it
        stamina = true,
        cash = true,
        bank = false, -- off by default for privacy
        job = true,
        serverId = true,
    },

    -- Vehicle HUD
    vehicle = {
        enabled = true,
        speedUnit = 'kmh', -- 'kmh' or 'mph'
        fuelScript = 'auto', -- auto-detect or force: 'LegacyFuel', 'ox_fuel', 'cdn-fuel'
        seatbelt = true,
    },

    -- Visual
    theme = 'dark', -- 'dark' or 'light'
    position = 'bottom-right', -- 'bottom-right', 'bottom-left', 'bottom-center'
    scale = 1.0,
    hideInPauseMenu = true,

    -- Performance tuning
    updateIntervals = {
        health = 200, -- ms — health, armor, hunger, thirst, stress, stamina
        vehicle = 100, -- ms — speed, fuel, engine, seatbelt
    },
}
