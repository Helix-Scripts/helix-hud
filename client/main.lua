local lib = exports.helix_lib:getLib()

--- Send current player status data to the NUI
local function sendStatusToNui()
    local ped = PlayerPedId()

    SendNUIMessage({
        action = 'updateStatus',
        data = {
            health = GetEntityHealth(ped) - 100, -- 0-100 range
            armor = GetPedArmour(ped),
            hunger = 100, -- TODO: integrate with helix_lib needs system
            thirst = 100, -- TODO: integrate with helix_lib needs system
            stress = 0,   -- TODO: integrate with helix_lib stress system
        },
    })
end

--- Toggle HUD visibility
---@param visible boolean
local function setHudVisible(visible)
    SendNUIMessage({
        action = 'setVisible',
        data = { visible = visible },
    })
end

-- NUI Callbacks
RegisterNUICallback('hudReady', function(_, cb)
    lib.print.info('HUD NUI ready')
    cb('ok')
end)

-- Status update loop
CreateThread(function()
    -- Wait for NUI to initialise
    Wait(1000)
    setHudVisible(true)

    while true do
        sendStatusToNui()
        Wait(Config.UpdateInterval or 200)
    end
end)
