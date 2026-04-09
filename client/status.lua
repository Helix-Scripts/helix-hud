---@class StatusData
---@field health number 0-100
---@field armor number 0-100
---@field hunger number 0-100
---@field thirst number 0-100
---@field stress number 0-100
---@field stamina number 0-100
---@field isDead boolean Whether the player is dead or incapacitated

---@class StatusModule
StatusModule = {}

local cachedStatus = {
    health = 100,
    armor = 0,
    hunger = 100,
    thirst = 100,
    stress = 0,
    stamina = 100,
    isDead = false,
}

-- Cached at init — never changes at runtime
---@type string|nil
local cachedFramework = nil

-- Cached core objects — resolved once at init
---@type table|nil
local cachedQBCore = nil
---@type table|nil
local cachedESX = nil

--- Initialize framework cache. Called once from main.lua init.
--- Returns the detected framework name for reuse by callers.
---@return string|nil framework The detected framework name
function StatusModule.initCache()
    local ok, fw = pcall(function()
        return exports['helix_lib']:bridge_framework()
    end)
    if ok and fw then
        cachedFramework = fw
    end

    if cachedFramework == 'qbox' or cachedFramework == 'qbcore' then
        -- Try qbx_core first (Qbox), fall back to qb-core
        pcall(function() cachedQBCore = exports['qbx_core']:GetCoreObject() end)
        if not cachedQBCore then
            pcall(function() cachedQBCore = exports['qb-core']:GetCoreObject() end)
        end
    elseif cachedFramework == 'esx' then
        pcall(function() cachedESX = exports['es_extended']:getSharedObject() end)
    end

    -- Warn if hunger/thirst enabled but no framework detected to provide values
    if not cachedFramework then
        if Config.elements.hunger or Config.elements.thirst then
            print('[helix_hud] ^3WARNING: hunger/thirst elements enabled but no framework detected — values will remain at defaults (100)^0')
        end
    end

    return cachedFramework
end

--- Get the current cached status data
---@return StatusData
function StatusModule.get()
    return cachedStatus
end

--- Poll all status data in a single pass. Called from status thread.
--- Combines native reads, dead detection, and framework metadata into
--- one function to avoid redundant GetPlayerData calls.
function StatusModule.poll()
    local ped = PlayerPedId()

    -- Native reads (cheap — direct native calls, no cross-resource IPC)
    local rawHealth = GetEntityHealth(ped)
    local maxHealth = GetEntityMaxHealth(ped)
    cachedStatus.armor = HudUtils.clamp(GetPedArmour(ped), 0, 100)
    cachedStatus.stamina = HudUtils.clamp(HudUtils.round(GetPlayerStamina(PlayerId())), 0, 100)

    -- Dead detection + framework metadata (single GetPlayerData call)
    local isDead = IsEntityDead(ped)

    if cachedFramework == 'qbox' or cachedFramework == 'qbcore' then
        if cachedQBCore then
            local PlayerData = cachedQBCore.Functions.GetPlayerData()
            if PlayerData and PlayerData.metadata then
                local meta = PlayerData.metadata
                -- Dead/incapacitated from framework
                if not isDead then
                    isDead = meta.inlaststand or meta.isdead or false
                end
                -- Hunger/thirst/stress from same PlayerData (no second call)
                if Config.elements.hunger then
                    cachedStatus.hunger = HudUtils.clamp(HudUtils.round(meta.hunger or 100), 0, 100)
                end
                if Config.elements.thirst then
                    cachedStatus.thirst = HudUtils.clamp(HudUtils.round(meta.thirst or 100), 0, 100)
                end
                if Config.elements.stress then
                    cachedStatus.stress = HudUtils.clamp(HudUtils.round(meta.stress or 0), 0, 100)
                end
            end
        end
    -- NOTE: When no framework is detected (standalone mode), hunger/thirst/stress
    -- retain their defaults (100/100/0) since there is no provider to update them.
    -- A one-time warning is logged at init if these elements are enabled without a framework.
    elseif cachedFramework == 'esx' then
        if cachedESX then
            local playerData = cachedESX.GetPlayerData()
            if playerData and playerData.metadata then
                if Config.elements.hunger then
                    cachedStatus.hunger = HudUtils.clamp(HudUtils.round(playerData.metadata.hunger or 100), 0, 100)
                end
                if Config.elements.thirst then
                    cachedStatus.thirst = HudUtils.clamp(HudUtils.round(playerData.metadata.thirst or 100), 0, 100)
                end
            end
            cachedStatus.stress = 0
        end
    end

    -- Apply dead state
    if isDead then
        cachedStatus.health = 0
        cachedStatus.isDead = true
    else
        if maxHealth <= 100 then
            cachedStatus.health = 0
        else
            cachedStatus.health = HudUtils.clamp(HudUtils.round(((rawHealth - 100) / (maxHealth - 100)) * 100), 0, 100)
        end
        cachedStatus.isDead = false
    end
end
