--- helix_hud client entry point
--- Manages polling threads and NUI communication.
--- Performance target: < 0.05ms idle resmon

local isHudVisible = false
local isNuiReady = false
local isPauseMenuActive = false
local isPlayerLoaded = false

--- Player info (event-driven, not polled)
local playerInfo = {
    cash = 0,
    bank = 0,
    job = '',
    serverId = 0,
}

-- ---------------------------------------------------------------------------
-- NUI Communication
-- ---------------------------------------------------------------------------

--- Send a batched HUD update to NUI
--- Flattens status, vehicle, and playerInfo into a single data table
--- matching the React HudState interface
local function sendHudUpdate()
    if not isNuiReady or not isHudVisible then
        return
    end

    local status = StatusModule.get()
    local vehicle = VehicleModule.get()

    SendNUIMessage({
        type = 'hud:update',
        data = {
            -- Character stats
            health = status.health,
            armor = status.armor,
            hunger = status.hunger,
            thirst = status.thirst,
            stress = status.stress,
            isDead = status.isDead,

            -- Identity
            playerId = playerInfo.serverId,
            jobLabel = playerInfo.job,
            showIdJob = Config.elements.serverId or Config.elements.job,

            -- Vehicle
            inVehicle = vehicle.active,
            speed = vehicle.speed,
            rpm = vehicle.rpm,
            gear = vehicle.gear,
            fuel = vehicle.fuel,
            engineOn = vehicle.engine,
            seatbeltOn = vehicle.seatbelt,
            headlightsOn = vehicle.lightsOn,
            engineHealth = vehicle.engineHealth,
        },
    })
end

--- Send config to NUI as a separate hud:config message
local function sendHudConfig()
    if not isNuiReady then
        return
    end

    SendNUIMessage({
        type = 'hud:config',
        config = {
            theme = Config.theme,
            speedUnit = Config.vehicle.speedUnit or 'kmh',
            autoHide = false,
            showValuesAlways = false,
            positions = Config.positions or nil,
        },
    })
end

--- Show or hide the HUD
---@param visible boolean
local function setHudVisible(visible)
    isHudVisible = visible
    if isNuiReady then
        SendNUIMessage({
            type = 'hud:visibility',
            visible = visible,
        })
    end
end

-- ---------------------------------------------------------------------------
-- Player Info (event-driven)
-- ---------------------------------------------------------------------------

--- Fetch initial player data from server
local function fetchPlayerInfo()
    playerInfo.serverId = GetPlayerServerId(PlayerId())
    TriggerServerEvent('helix_hud:requestPlayerData')
end

--- Handle player data response from server
RegisterNetEvent('helix_hud:playerData', function(data)
    if data.cash ~= nil then
        playerInfo.cash = data.cash
    end
    if data.bank ~= nil then
        playerInfo.bank = data.bank
    end
    if data.job ~= nil then
        playerInfo.job = data.job
    end
end)

-- ---------------------------------------------------------------------------
-- Framework Event Listeners (money/job changes — no polling needed)
-- ---------------------------------------------------------------------------

local function registerFrameworkEvents()
    local fw = exports['helix_lib']:bridge_framework()
    if not fw then
        return
    end

    if fw == 'qbox' or fw == 'qbcore' then
        -- QBCore/Qbox: listen for PlayerData updates
        RegisterNetEvent('QBCore:Player:SetPlayerData', function(PlayerData)
            if PlayerData.money then
                playerInfo.cash = PlayerData.money.cash or 0
                playerInfo.bank = PlayerData.money.bank or 0
            end
            if PlayerData.job then
                playerInfo.job = PlayerData.job.label or ''
            end
        end)

        RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
            isPlayerLoaded = true
            fetchPlayerInfo()
            if isNuiReady then
                setHudVisible(true)
                sendHudUpdate()
            end
        end)

        -- Also check if already loaded (reconnect / late start)
        pcall(function()
            local QBCore = exports['qb-core']:GetCoreObject() or exports['qbx_core']:GetCoreObject()
            local PlayerData = QBCore.Functions.GetPlayerData()
            if PlayerData and PlayerData.citizenid and PlayerData.citizenid ~= '' then
                isPlayerLoaded = true
            end
        end)
    elseif fw == 'esx' then
        RegisterNetEvent('esx:setAccountMoney', function(account)
            if account.name == 'money' or account.name == 'cash' then
                playerInfo.cash = account.money or 0
            elseif account.name == 'bank' then
                playerInfo.bank = account.money or 0
            end
        end)

        RegisterNetEvent('esx:setJob', function(job)
            playerInfo.job = job.label or ''
        end)

        RegisterNetEvent('esx:playerLoaded', function()
            isPlayerLoaded = true
            fetchPlayerInfo()
            if isNuiReady then
                setHudVisible(true)
                sendHudUpdate()
            end
        end)
    end
end

-- ---------------------------------------------------------------------------
-- Exports — allow other resources to control HUD visibility
-- ---------------------------------------------------------------------------

exports('setVisible', setHudVisible)
exports('isVisible', function()
    return isHudVisible
end)

-- ---------------------------------------------------------------------------
-- Chat Command: /hud — toggle visibility
-- ---------------------------------------------------------------------------

RegisterCommand('hud', function()
    setHudVisible(not isHudVisible)
end, false)

TriggerEvent('chat:addSuggestion', '/hud', 'Toggle HUD visibility')

-- ---------------------------------------------------------------------------
-- NUI Callbacks
-- ---------------------------------------------------------------------------

RegisterNUICallback('hudReady', function(_, cb)
    isNuiReady = true
    cb('ok')

    -- Send initial config but DON'T show HUD until player is loaded
    sendHudConfig()
    if isPlayerLoaded then
        setHudVisible(true)
        sendHudUpdate()
    end
end)

-- ---------------------------------------------------------------------------
-- Fallback: playerSpawned event (works for all frameworks)
-- ---------------------------------------------------------------------------

AddEventHandler('playerSpawned', function()
    if not isPlayerLoaded then
        isPlayerLoaded = true
        if isNuiReady then
            setHudVisible(true)
            sendHudUpdate()
        end
    end
end)

-- ---------------------------------------------------------------------------
-- Polling Threads
-- ---------------------------------------------------------------------------

--- Status polling thread (health, armor, hunger, thirst, stress, stamina)
local function startStatusThread()
    CreateThread(function()
        while true do
            if isHudVisible and not isPauseMenuActive then
                StatusModule.pollNatives()
                StatusModule.pollFramework()
                sendHudUpdate()
            end
            Wait(Config.updateIntervals.health)
        end
    end)
end

--- Vehicle polling thread (speed, fuel, seatbelt, engine)
local function startVehicleThread()
    if not Config.vehicle.enabled then
        return
    end

    CreateThread(function()
        while true do
            if isHudVisible and not isPauseMenuActive then
                local ped = PlayerPedId()
                local vehicle = GetVehiclePedIsIn(ped, false)

                if vehicle ~= 0 then
                    VehicleModule.poll(vehicle)
                else
                    if VehicleModule.get().active then
                        VehicleModule.reset()
                        sendHudUpdate()
                    end
                end
            end
            Wait(Config.updateIntervals.vehicle)
        end
    end)
end

--- Pause menu detection thread
local function startPauseMenuThread()
    if not Config.hideInPauseMenu then
        return
    end

    CreateThread(function()
        while true do
            local paused = IsPauseMenuActive()
            if paused ~= isPauseMenuActive then
                isPauseMenuActive = paused
                setHudVisible(not paused)
            end
            Wait(500)
        end
    end)
end

-- ---------------------------------------------------------------------------
-- Hide native GTA HUD elements that overlap with helix_hud
-- ---------------------------------------------------------------------------

local function startNativeHudThread()
    CreateThread(function()
        while true do
            if isHudVisible then
                -- Hide native components that helix_hud replaces
                HideHudComponentThisFrame(1)   -- WANTED_STARS
                HideHudComponentThisFrame(3)   -- CASH
                HideHudComponentThisFrame(4)   -- MP_CASH
                HideHudComponentThisFrame(6)   -- VEHICLE_NAME
                HideHudComponentThisFrame(7)   -- AREA_NAME
                HideHudComponentThisFrame(8)   -- VEHICLE_CLASS
                HideHudComponentThisFrame(9)   -- STREET_NAME
                Wait(0)
            else
                Wait(500)
            end
        end
    end)
end

-- ---------------------------------------------------------------------------
-- Minimap management — reposition to avoid overlap with HUD
-- ---------------------------------------------------------------------------

local function setupMinimap()
    -- Minimap anchor: push down slightly to avoid stat bar overlap
    -- Default GTA minimap sits at bottom-left; we keep it there but adjust
    -- the safezone to match helix_hud's stat bar positioning
    SetMinimapComponentPosition('minimap', 'L', 'B', 0.0, -0.03, 0.15, 0.20)
    SetMinimapComponentPosition('minimap_mask', 'L', 'B', 0.0, 0.0, 0.128, 0.20)
    SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.01, -0.03, 0.17, 0.22)

    -- Ensure radar is visible
    DisplayRadar(true)
end

-- ---------------------------------------------------------------------------
-- Initialization
-- ---------------------------------------------------------------------------

CreateThread(function()
    -- Wait for helix_lib to be ready
    while GetResourceState('helix_lib') ~= 'started' do
        Wait(100)
    end

    -- Small delay to let framework initialize
    Wait(1000)

    playerInfo.serverId = GetPlayerServerId(PlayerId())

    registerFrameworkEvents()
    fetchPlayerInfo()
    setupMinimap()

    startStatusThread()
    startVehicleThread()
    startPauseMenuThread()
    startNativeHudThread()
end)
