--- helix_hud server entry point
--- Handles player data requests for money and job info.

-- ---------------------------------------------------------------------------
-- Rate limiter — one request per player per COOLDOWN seconds
-- ---------------------------------------------------------------------------

---@type table<number, number>
local lastRequest = {}
local REQUEST_COOLDOWN = 5

AddEventHandler('playerDropped', function()
    lastRequest[source] = nil
end)

--- Handle player data request from client (rate-limited)
RegisterNetEvent('helix_hud:requestPlayerData', function()
    local src = source
    if not src or src <= 0 then
        return
    end

    local now = os.time()
    if lastRequest[src] and (now - lastRequest[src]) < REQUEST_COOLDOWN then
        return
    end
    lastRequest[src] = now

    local Bridge = exports['helix_lib']:bridge()
    if not Bridge then
        return
    end

    local player = Bridge.GetPlayer(src)
    if not player then
        return
    end

    local data = {
        cash = player.money and player.money.cash or 0,
        bank = player.money and player.money.bank or 0,
        job = player.job and player.job.label or '',
    }

    TriggerClientEvent('helix_hud:playerData', src, data)
end)

--- Version check on start
CreateThread(function()
    local currentVersion = GetResourceMetadata(GetCurrentResourceName(), 'version', 0)
    print(('[helix_hud] ^2v%s loaded^0'):format(currentVersion or '0.0.0'))
end)
