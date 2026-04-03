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

--- Get the current cached status data
---@return StatusData
function StatusModule.get()
    return cachedStatus
end

--- Poll native player stats (health, armor, stamina)
--- Called from the status thread at Config.updateIntervals.health
function StatusModule.pollNatives()
    local ped = PlayerPedId()

    -- Dead / incapacitated detection (framework metadata takes priority)
    local isDead = IsEntityDead(ped)
    if not isDead then
        pcall(function()
            local QBCore = exports['qb-core']:GetCoreObject() or exports['qbx_core']:GetCoreObject()
            local PlayerData = QBCore.Functions.GetPlayerData()
            if PlayerData and PlayerData.metadata then
                isDead = PlayerData.metadata.inlaststand or PlayerData.metadata.isdead or false
            end
        end)
    end

    if isDead then
        cachedStatus.health = 0
        cachedStatus.isDead = true
    else
        -- Health: GTA returns 100-200, map to 0-100
        local rawHealth = GetEntityHealth(ped)
        local maxHealth = GetEntityMaxHealth(ped)
        cachedStatus.health = HudUtils.clamp(HudUtils.round(((rawHealth - 100) / (maxHealth - 100)) * 100), 0, 100)
        cachedStatus.isDead = false
    end

    -- Armor: 0-100 native
    cachedStatus.armor = HudUtils.clamp(GetPedArmour(ped), 0, 100)

    -- Stamina: 0-100 (inverted — native returns remaining stamina)
    cachedStatus.stamina = HudUtils.clamp(HudUtils.round(GetPlayerStamina(PlayerId())), 0, 100)
end

--- Poll framework-dependent stats (hunger, thirst, stress)
--- Uses QBCore/Qbox PlayerData metadata or ESX status
function StatusModule.pollFramework()
    local fw = exports['helix_lib']:bridge_framework()
    if not fw then
        return
    end

    if fw == 'qbox' or fw == 'qbcore' then
        StatusModule._pollQB()
    elseif fw == 'esx' then
        StatusModule._pollESX()
    end
    -- standalone: hunger/thirst/stress not available, bars will be hidden
end

--- Poll Qbox/QBCore player metadata for hunger, thirst, stress
function StatusModule._pollQB()
    local ok, QBCore = pcall(function()
        return exports['qb-core']:GetCoreObject()
    end)
    if not ok then
        -- Try qbx_core
        ok, QBCore = pcall(function()
            return exports['qbx_core']:GetCoreObject()
        end)
    end
    if not ok or not QBCore then
        return
    end

    local PlayerData = QBCore.Functions.GetPlayerData()
    if not PlayerData or not PlayerData.metadata then
        return
    end

    local meta = PlayerData.metadata
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

--- Poll ESX status for hunger, thirst, stress
function StatusModule._pollESX()
    local ok, ESX = pcall(function()
        return exports['es_extended']:getSharedObject()
    end)
    if not ok or not ESX then
        return
    end

    local playerData = ESX.GetPlayerData()
    if not playerData then
        return
    end

    -- ESX uses esx_status or esx_basicneeds
    -- Status values vary by implementation, attempt common patterns
    if playerData.metadata then
        if Config.elements.hunger then
            cachedStatus.hunger = HudUtils.clamp(HudUtils.round(playerData.metadata.hunger or 100), 0, 100)
        end
        if Config.elements.thirst then
            cachedStatus.thirst = HudUtils.clamp(HudUtils.round(playerData.metadata.thirst or 100), 0, 100)
        end
    end
    -- ESX typically doesn't have stress
    cachedStatus.stress = 0
end
