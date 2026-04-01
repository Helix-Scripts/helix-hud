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
    theme = 'dark', -- 'dark', 'light', or 'auto'
    hideInPauseMenu = true,

    -- Element positions (px from screen edge). Omit to use defaults.
    -- positions = {
    --     vehicleCluster = { bottom = 40, right = 60 },
    --     statBars = { bottom = 14, left = 40 },
    --     idJob = { top = 28, right = 40 },
    --     gear = { bottom = 136, right = 148 },
    -- },

    -- Performance tuning
    updateIntervals = {
        health = 200, -- ms — health, armor, hunger, thirst, stress, stamina
        vehicle = 100, -- ms — speed, fuel, engine, seatbelt
    },
}
