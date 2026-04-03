---@class VehicleData
---@field active boolean Whether the player is in a vehicle
---@field speed number Current speed in configured unit
---@field rpm number 0.0-1.0 normalized RPM
---@field gear number Current gear (-1=R, 0=N, 1-6=forward)
---@field fuel number 0-100 fuel level
---@field engine boolean Engine running
---@field seatbelt boolean Seatbelt fastened
---@field lightsOn boolean Vehicle lights on
---@field engineHealth number 0-1000 engine health (GTA native)
---@field speedUnit string 'kmh' or 'mph'

---@class VehicleModule
VehicleModule = {}

local cachedVehicle = {
    active = false,
    speed = 0,
    rpm = 0,
    gear = 0,
    fuel = 0,
    engine = false,
    seatbelt = false,
    lightsOn = false,
    engineHealth = 1000,
    speedUnit = 'kmh',
}

--- Get the current cached vehicle data
---@return VehicleData
function VehicleModule.get()
    return cachedVehicle
end

--- Poll vehicle data — only called when player is in a vehicle
---@param vehicle integer Vehicle entity handle
function VehicleModule.poll(vehicle)
    cachedVehicle.active = true
    cachedVehicle.engine = GetIsVehicleEngineRunning(vehicle)
    cachedVehicle.speed = HudUtils.getVehicleSpeed(vehicle)
    cachedVehicle.rpm = cachedVehicle.engine and GetVehicleCurrentRpm(vehicle) or 0.0
    cachedVehicle.gear = GetVehicleCurrentGear(vehicle) -- 0=N, 1-6=forward gears
    cachedVehicle.fuel = HudUtils.getVehicleFuel(vehicle)
    cachedVehicle.seatbelt = HudUtils.isSeatbeltOn()
    cachedVehicle.engineHealth = GetVehicleEngineHealth(vehicle) -- 0–1000
    cachedVehicle.speedUnit = Config.vehicle.speedUnit

    -- Check lights state (returns multiple values: retval, lightsOn, highbeamsOn)
    local _, lightsOn, highbeamsOn = GetVehicleLightsState(vehicle)
    cachedVehicle.lightsOn = lightsOn == 1 or highbeamsOn == 1
end

--- Reset vehicle data when exiting a vehicle
function VehicleModule.reset()
    cachedVehicle.active = false
    cachedVehicle.speed = 0
    cachedVehicle.rpm = 0
    cachedVehicle.gear = 0
    cachedVehicle.fuel = 0
    cachedVehicle.engine = false
    cachedVehicle.seatbelt = false
    cachedVehicle.lightsOn = false
    cachedVehicle.engineHealth = 1000
end
