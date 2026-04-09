--- helix_hud client entry point
--- Manages polling threads and NUI communication.
--- Performance target: < 0.01ms idle resmon

local isHudVisible = false
local isUserVisible = true       -- User intent (toggled by /hud and setVisible export)
local isNuiReady = false
local isPauseMenuActive = false
local isPlayerLoaded = false
local isRadarVisible = false
local minimapScaleform = 0
local minimapPositioned = false  -- Track whether minimap sizing has been applied

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
    if type(data) ~= 'table' then return end
    if type(data.cash) == 'number' then playerInfo.cash = data.cash end
    if type(data.bank) == 'number' then playerInfo.bank = data.bank end
    if type(data.job) == 'string' then playerInfo.job = data.job end
end)

-- ---------------------------------------------------------------------------
-- Framework Event Listeners (money/job changes — no polling needed)
-- ---------------------------------------------------------------------------

--- Register framework-specific event listeners for money/job updates.
--- Accepts framework identifier from StatusModule.initCache to avoid duplicate export call.
---@param fw string|nil Framework name ('qbox', 'qbcore', 'esx', or nil)
local function registerFrameworkEvents(fw)
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
            DisplayRadar(false)
            isRadarVisible = false
            fetchPlayerInfo()
            if isNuiReady then
                setHudVisible(isUserVisible and not isPauseMenuActive)
                sendHudUpdateForced()
            end
        end)

        -- Note: no pcall GetPlayerData check here — PlayerData.citizenid
        -- can be non-empty during character selection, causing false positives.
        -- Only LocalPlayer.state.isLoggedIn (checked in init) is reliable.
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
            DisplayRadar(false)
            isRadarVisible = false
            fetchPlayerInfo()
            if isNuiReady then
                setHudVisible(isUserVisible and not isPauseMenuActive)
                sendHudUpdateForced()
            end
        end)
    end
end

-- ---------------------------------------------------------------------------
-- Exports — allow other resources to control HUD visibility
-- ---------------------------------------------------------------------------

--- Set user-intended visibility and update effective HUD state
---@param visible boolean
local function setUserVisible(visible)
    isUserVisible = visible
    local effective = isUserVisible and not isPauseMenuActive
    setHudVisible(effective)
end

exports('setVisible', setUserVisible)
exports('isVisible', function()
    return isHudVisible
end)

-- ---------------------------------------------------------------------------
-- Chat Command: /hud — toggle visibility
-- ---------------------------------------------------------------------------

RegisterCommand('hud', function()
    setUserVisible(not isUserVisible)
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
        setHudVisible(isUserVisible and not isPauseMenuActive)
        sendHudUpdateForced()
    end
end)

-- ---------------------------------------------------------------------------
-- Fallback: playerSpawned event (works for all frameworks)
-- ---------------------------------------------------------------------------

AddEventHandler('playerSpawned', function()
    if not isPlayerLoaded then
        isPlayerLoaded = true
        DisplayRadar(false)
        isRadarVisible = false
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
                        UnlockMinimapAngle()
                        isRadarVisible = true
                    end
                else
                    if VehicleModule.get().active then
                        VehicleModule.reset()
                        sendHudUpdate()
                    end
                    -- Only call DisplayRadar(false) on the transition from visible to hidden,
                    -- not every tick. Other resources may re-enable radar, but redundant
                    -- native calls are wasteful — the native HUD thread handles enforcement.
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
                -- Derive effective visibility from user intent + pause state
                local effective = isUserVisible and not isPauseMenuActive
                setHudVisible(effective)
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
                -- Hide native HUD text overlays
                HideHudComponentThisFrame(3)   -- CASH
                HideHudComponentThisFrame(4)   -- MP_CASH
                HideHudComponentThisFrame(6)   -- VEHICLE_NAME
                HideHudComponentThisFrame(7)   -- AREA_NAME
                HideHudComponentThisFrame(8)   -- VEHICLE_CLASS
                HideHudComponentThisFrame(9)   -- STREET_NAME

                -- Suppress native health/armor bars below minimap.
                -- These bars are rendered inside the minimap scaleform (minimap.gfx).
                -- SETUP_HEALTH_ARMOUR(3) switches the scaleform to "golf mode"
                -- which attaches an empty placeholder instead of health/armor bars.
                -- Must be called every frame to prevent the game from resetting it.
                -- Source: SimpleMinimap, joemap, cfx.re community — proven approach.
                if minimapScaleform ~= 0 then
                    BeginScaleformMovieMethod(minimapScaleform, 'SETUP_HEALTH_ARMOUR')
                    ScaleformMovieMethodAddParamInt(3)
                    EndScaleformMovieMethod()
                end

                -- Minimap sizing: only reposition when not yet applied or when
                -- bigmap state changed. Checking IsBigmapActive each frame is
                -- cheap (single native), while SetMinimapComponentPosition is not.
                if isRadarVisible then
                    local bigmapActive = IsBigmapActive()
                    if bigmapActive then
                        SetRadarBigmapEnabled(false, false)
                        minimapPositioned = false -- force re-apply after bigmap toggle
                    end
                    if not minimapPositioned then
                        SetMinimapComponentPosition('minimap', 'L', 'B', -0.02, -0.025, 0.20, 0.18)
                        SetMinimapComponentPosition('minimap_mask', 'L', 'B', -0.02, 0.0, 0.16, 0.20)
                        SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.025, 0.01, 0.32, 0.30)
                        minimapPositioned = true
                    end
                end

                Wait(0)
            else
                Wait(500)
            end
        end
    end)
end

-- ---------------------------------------------------------------------------
-- Minimap / radar management
-- Radar hidden on foot (no minimap needed), shown in vehicle for navigation.
-- ---------------------------------------------------------------------------

local function setupMinimap()
    -- Request the minimap scaleform handle and wait until it is fully loaded.
    -- On fresh connect the scaleform may take several frames to load; without
    -- this wait, SETUP_HEALTH_ARMOUR and component positioning silently fail.
    minimapScaleform = RequestScaleformMovie('minimap')
    while not HasScaleformMovieLoaded(minimapScaleform) do
        Wait(0)
    end

    -- The bigmap toggle forces the scaleform to fully initialize its
    -- internal state — without it, certain methods silently no-op.
    SetRadarBigmapEnabled(true, false)
    Wait(0)
    SetRadarBigmapEnabled(false, false)

    -- Start with radar hidden on foot
    DisplayRadar(false)
    isRadarVisible = false

    -- Minimap sizing — tuned with Robin.
    -- Also enforced every frame in startNativeHudThread to survive
    -- deferred game resets and bigmap re-activation on fresh login.
    SetMinimapComponentPosition('minimap', 'L', 'B', -0.02, -0.025, 0.20, 0.18)
    SetMinimapComponentPosition('minimap_mask', 'L', 'B', -0.02, 0.0, 0.16, 0.20)
    SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.025, 0.01, 0.32, 0.30)
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
    local framework = StatusModule.initCache()

    playerInfo.serverId = GetPlayerServerId(PlayerId())

    registerFrameworkEvents(framework)
    fetchPlayerInfo()
    setupMinimap()

    -- Detect if player is already logged in (resource restart / late start)
    -- Only use state bag — ped existence is unreliable (ped exists during
    -- character selection screen, which caused false-positive regression).
    if not isPlayerLoaded and LocalPlayer.state.isLoggedIn then
        isPlayerLoaded = true
    end

    -- If player was already loaded (resource restart), show HUD now
    if isPlayerLoaded and isNuiReady then
        DisplayRadar(false)
        isRadarVisible = false
        setHudVisible(isUserVisible and not isPauseMenuActive)
        sendHudUpdateForced()
    end

    startStatusThread()
    startVehicleThread()
    startPauseMenuThread()
    startNativeHudThread()
end)
