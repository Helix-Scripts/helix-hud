---@class HudUtils
HudUtils = {}

--- Clamp a number between min and max
---@param value number
---@param min number
---@param max number
---@return number
function HudUtils.clamp(value, min, max)
    if value < min then
        return min
    elseif value > max then
        return max
    end
    return value
end

--- Round a number to the nearest integer
---@param value number
---@return integer
function HudUtils.round(value)
    return math.floor(value + 0.5)
end

--- Get vehicle speed in the configured unit
---@param vehicle integer Vehicle entity handle
---@return number speed
function HudUtils.getVehicleSpeed(vehicle)
    local speedMs = GetEntitySpeed(vehicle)
    if Config.vehicle.speedUnit == 'mph' then
        return HudUtils.round(speedMs * 2.236936) -- m/s to mph
    end
    return HudUtils.round(speedMs * 3.6) -- m/s to km/h
end

--- Detect the fuel script in use and get the fuel level
---@param vehicle integer Vehicle entity handle
---@return number fuel 0-100
function HudUtils.getVehicleFuel(vehicle)
    local fuelScript = Config.vehicle.fuelScript

    if fuelScript == 'auto' then
        if GetResourceState('ox_fuel') == 'started' then
            fuelScript = 'ox_fuel'
        elseif GetResourceState('cdn-fuel') == 'started' then
            fuelScript = 'cdn-fuel'
        elseif GetResourceState('LegacyFuel') == 'started' then
            fuelScript = 'LegacyFuel'
        else
            fuelScript = 'native'
        end
    end

    if fuelScript == 'ox_fuel' then
        local ok, fuel = pcall(function()
            return Entity(vehicle).state.fuel or GetVehicleFuelLevel(vehicle)
        end)
        if ok then
            return HudUtils.clamp(HudUtils.round(fuel), 0, 100)
        end
    elseif fuelScript == 'cdn-fuel' then
        local ok, fuel = pcall(function()
            return exports['cdn-fuel']:GetFuel(vehicle)
        end)
        if ok and fuel then
            return HudUtils.clamp(HudUtils.round(fuel), 0, 100)
        end
    elseif fuelScript == 'LegacyFuel' then
        local ok, fuel = pcall(function()
            return exports['LegacyFuel']:GetFuel(vehicle)
        end)
        if ok and fuel then
            return HudUtils.clamp(HudUtils.round(fuel), 0, 100)
        end
    end

    -- Native fallback
    return HudUtils.clamp(HudUtils.round(GetVehicleFuelLevel(vehicle)), 0, 100)
end

--- Check if a seatbelt resource is active and player has belt on
---@return boolean
function HudUtils.isSeatbeltOn()
    if not Config.vehicle.seatbelt then
        return false
    end

    -- Primary: state bags (used by qbx_seatbelt and most modern seatbelt resources)
    local state = LocalPlayer.state
    if state.seatbelt ~= nil then
        return state.seatbelt == true
    end
    if state.harness ~= nil and state.harness then
        return true
    end

    -- Fallback: check common seatbelt exports
    local ok, result

    ok, result = pcall(function()
        return exports['qb-seatbelt']:IsWearingSeatbelt()
    end)
    if ok and result ~= nil then
        return result == true
    end

    ok, result = pcall(function()
        return exports['seatbelt']:isSeatbeltOn()
    end)
    if ok and result ~= nil then
        return result == true
    end

    return false
end
