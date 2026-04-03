--- helix_hud client entry point
--- Manages polling threads and NUI communication.
--- Performance target: < 0.01ms idle resmon

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
-- NUI Communication (with diff — skip sends when nothing changed)
-- ---------------------------------------------------------------------------

local lastSentJson = ''

--- Build the HUD data payload
---@return table
local function buildHudData()
    local status = StatusModule.get()
    local vehicle = VehicleModule.get()

    return {
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
    }
end

--- Send a batched HUD update to NUI, but only if data actually changed
local function sendHudUpdate()
    if not isNuiReady or not isHudVisible then
        return
    end

    local data = buildHudData()
    local encoded = json.encode(data)

    -- Skip NUI IPC when nothing changed (biggest idle perf win)
    if encoded == lastSentJson then
        return
    end
    lastSentJson = encoded

    SendNUIMessage({
        type = 'hud:update',
        data = data,
    })
end

--- Force send (bypasses diff — used for initial update after visibility change)
local function sendHudUpdateForced()
    if not isNuiReady or not isHudVisible then
        return
    end
    lastSentJson = '' -- invalidate cache
    sendHudUpdate()
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
                sendHudUpdateForced()
            end
        end)

        -- Check if already loaded (reconnect / late start)
        pcall(function()
            local QBCore = exports['qbx_core']:GetCoreObject() or exports['qb-core']:GetCoreObject()
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
                sendHudUpdateForced()
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
        sendHudUpdateForced()
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
            sendHudUpdateForced()
        end
    end
end)

-- ---------------------------------------------------------------------------
-- Polling Threads
-- ---------------------------------------------------------------------------

--- Status polling thread (health, armor, hunger, thirst, stress, stamina)
--- Single combined poll — no redundant export calls
local function startStatusThread()
    CreateThread(function()
        while true do
            if isHudVisible and not isPauseMenuActive then
                StatusModule.poll()
                sendHudUpdate()  -- diffed — skips NUI IPC when nothing changed
            end
            Wait(Config.updateIntervals.health)
        end
    end)
end

--- Make native health/armor/stamina arc colours fully transparent.
--- Must be re-applied after every DisplayRadar(true) — the game
--- resets HUD colours when radar visibility changes.
local function applyTransparentArcs()
    ReplaceHudColourWithRgba(116, 0, 0, 0, 0)  -- Health bar fill
    ReplaceHudColourWithRgba(117, 0, 0, 0, 0)  -- Health damage flash
    ReplaceHudColourWithRgba(118, 0, 0, 0, 0)  -- Armor bar fill
    ReplaceHudColourWithRgba(119, 0, 0, 0, 0)  -- Armor bar background
    ReplaceHudColourWithRgba(152, 0, 0, 0, 0)  -- Stamina bar
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
                    -- Show radar when in vehicle (minimap is useful for driving)
                    if not isRadarVisible then
                        DisplayRadar(true)
                        isRadarVisible = true
                        -- Re-apply transparent arcs (game resets colours on radar toggle)
                        applyTransparentArcs()
                    end
                else
                    if VehicleModule.get().active then
                        VehicleModule.reset()
                        sendHudUpdate()
                    end
                    -- Hide radar on foot (also hides native health/armor arcs)
                    if isRadarVisible then
                        DisplayRadar(false)
                        isRadarVisible = false
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
-- Minimap / radar management
-- The native health/armor bars are arcs rendered as part of the minimap
-- scaleform — they can't be hidden with HideHudComponentThisFrame or
-- ReplaceHudColourWithRgba reliably. The proven approach (used by qbx_hud)
-- is to hide the radar on foot and only show it in vehicles.
-- helix_hud's NUI replaces all info the minimap bars provided.
-- ---------------------------------------------------------------------------

local isRadarVisible = false

local function setupMinimap()
    -- Start with radar hidden on foot
    DisplayRadar(false)
    isRadarVisible = false
    -- No custom minimap positioning — let GTA use its defaults
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

    -- Cache framework + core objects ONCE (never changes at runtime)
    StatusModule.initCache()

    playerInfo.serverId = GetPlayerServerId(PlayerId())

    registerFrameworkEvents()
    fetchPlayerInfo()
    setupMinimap()

    -- Detect if player is already logged in (resource restart / late start)
    -- This handles the case where helix_hud is restarted after player login.
    -- The hudReady callback fires BEFORE this init thread completes (due to
    -- Wait(1000) above), so we must also trigger visibility here.
    if not isPlayerLoaded then
        -- Qbox: state bag is the most reliable indicator
        if LocalPlayer.state.isLoggedIn then
            isPlayerLoaded = true
        end
        -- Fallback: if ped exists and has health, player is likely in-game
        if not isPlayerLoaded then
            local ped = PlayerPedId()
            if ped ~= 0 and DoesEntityExist(ped) and not IsEntityDead(ped) then
                isPlayerLoaded = true
            end
        end
    end

    -- If player was already loaded (resource restart), show HUD now
    if isPlayerLoaded and isNuiReady then
        setHudVisible(true)
        sendHudUpdateForced()
    end

    startStatusThread()
    startVehicleThread()
    startPauseMenuThread()
    startNativeHudThread()
end)
