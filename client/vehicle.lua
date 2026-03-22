---@class VehicleData
---@field active boolean Whether the player is in a vehicle
---@field speed number Current speed in configured unit
---@field fuel number 0-100 fuel level
---@field engine boolean Engine running
---@field seatbelt boolean Seatbelt fastened
---@field speedUnit string 'kmh' or 'mph'

---@class VehicleModule
VehicleModule = {}

local cachedVehicle = {
    active = false,
    speed = 0,
    fuel = 0,
    engine = false,
    seatbelt = false,
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
    cachedVehicle.speed = HudUtils.getVehicleSpeed(vehicle)
    cachedVehicle.fuel = HudUtils.getVehicleFuel(vehicle)
    cachedVehicle.engine = GetIsVehicleEngineRunning(vehicle)
    cachedVehicle.seatbelt = HudUtils.isSeatbeltOn()
    cachedVehicle.speedUnit = Config.vehicle.speedUnit
end

--- Reset vehicle data when exiting a vehicle
function VehicleModule.reset()
    cachedVehicle.active = false
    cachedVehicle.speed = 0
    cachedVehicle.fuel = 0
    cachedVehicle.engine = false
    cachedVehicle.seatbelt = false
end
