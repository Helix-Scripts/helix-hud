local lib = exports.helix_lib:getLib()

--- Load and merge configuration using helix_lib config system
---@return table
local function loadConfig()
    local default = {
        showHealth = true,
        showArmor = true,
        showHunger = true,
        showThirst = true,
        showStress = true,
        updateInterval = 200,
    }

    local cfg = lib.config and lib.config.load('helix-hud', default) or default

    -- Sync top-level Config table for backwards compatibility
    Config = Config or {}
    Config.ShowHealth = cfg.showHealth
    Config.ShowArmor = cfg.showArmor
    Config.ShowHunger = cfg.showHunger
    Config.ShowThirst = cfg.showThirst
    Config.ShowStress = cfg.showStress
    Config.UpdateInterval = cfg.updateInterval

    return cfg
end

loadConfig()
