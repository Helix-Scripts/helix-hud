--- helix_hud client entry point
--- Manages polling threads and NUI communication.
--- Performance target: < 0.05ms idle resmon

local isHudVisible = false
local isNuiReady = false
local isPauseMenuActive = false

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
local function sendHudUpdate()
    if not isNuiReady or not isHudVisible then
        return
    end

    SendNUIMessage({
        action = 'updateHud',
        status = StatusModule.get(),
        vehicle = VehicleModule.get(),
        playerInfo = playerInfo,
        config = {
            elements = Config.elements,
            vehicle = Config.vehicle,
            theme = Config.theme,
            position = Config.position,
            scale = Config.scale,
        },
    })
end

--- Show or hide the HUD
---@param visible boolean
local function setHudVisible(visible)
    isHudVisible = visible
    if isNuiReady then
        SendNUIMessage({
            action = 'setVisible',
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
            fetchPlayerInfo()
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
            fetchPlayerInfo()
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

    -- Send initial state
    setHudVisible(true)
    sendHudUpdate()
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

    startStatusThread()
    startVehicleThread()
    startPauseMenuThread()
end)
