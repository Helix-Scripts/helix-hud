--- Mock FiveM native functions and globals for busted tests.
--- Load this before any game scripts.

-- Simulated player ped handles
local _mockPeds = {}
local _mockHealth = {}
local _mockArmor = {}

--- Seed a mock player into the environment
---@param src number  Server ID
---@param ped number  Ped handle
---@param health number|nil  Optional health (default 200)
---@param armor number|nil  Optional armor (default 0)
function MockPlayer(src, ped, health, armor)
    _mockPeds[src] = ped
    _mockHealth[ped] = health or 200
    _mockArmor[ped] = armor or 0
end

--- Clear all mock players
function ClearMockPlayers()
    _mockPeds = {}
    _mockHealth = {}
    _mockArmor = {}
end

-- FiveM globals ----------------------------------------------------------------

---@diagnostic disable: lowercase-global

function GetPlayerPed(src)
    return _mockPeds[src] or 0
end

function GetEntityHealth(ped)
    return _mockHealth[ped] or 0
end

function GetPedArmour(ped)
    return _mockArmor[ped] or 0
end

function GetCurrentResourceName()
    return 'helix_hud'
end

function GetResourceMetadata(resource, key, index)
    if key == 'version' then return '1.0.0' end
    return nil
end

-- source global (simulates server-side source)
source = 1

-- Event system stubs -----------------------------------------------------------

local _registeredEvents = {}
local _registeredNetEvents = {}
local _threads = {}
local _triggeredClientEvents = {}

function AddEventHandler(event, cb)
    _registeredEvents[event] = _registeredEvents[event] or {}
    table.insert(_registeredEvents[event], cb)
end

function RegisterNetEvent(event, cb)
    _registeredNetEvents[event] = _registeredNetEvents[event] or {}
    if cb then
        table.insert(_registeredNetEvents[event], cb)
    end
end

function TriggerClientEvent(event, target, ...)
    table.insert(_triggeredClientEvents, {
        event = event,
        target = target,
        args = { ... },
    })
end

function CreateThread(cb)
    table.insert(_threads, cb)
end

--- Run all pending threads (call after loading server script)
function RunMockThreads()
    for _, cb in ipairs(_threads) do
        cb()
    end
end

--- Get list of triggered client events for assertions
---@return table[]
function GetTriggeredClientEvents()
    return _triggeredClientEvents
end

--- Clear triggered client events
function ClearTriggeredClientEvents()
    _triggeredClientEvents = {}
end

--- Fire a registered net event handler (simulate client->server trigger)
---@param event string
---@param mockSource number  Simulated source player
function FireNetEvent(event, mockSource, ...)
    local oldSource = source
    source = mockSource
    local handlers = _registeredNetEvents[event]
    if handlers then
        for _, cb in ipairs(handlers) do
            cb(...)
        end
    end
    source = oldSource
end

--- Fire a registered event handler
---@param event string
function FireEvent(event, ...)
    local handlers = _registeredEvents[event]
    if handlers then
        for _, cb in ipairs(handlers) do
            cb(...)
        end
    end
end

-- os.time stub (returns incrementing time for rate limit tests)
local _mockTime = 1000
local _realOsTime = os.time

--- Advance mock time by N seconds
function AdvanceMockTime(n)
    _mockTime = _mockTime + n
end

--- Reset mock time
function ResetMockTime()
    _mockTime = 1000
end

os.time = function()
    return _mockTime
end

-- exports stub -----------------------------------------------------------------

local _exports = {}

exports = setmetatable({}, {
    __index = function(_, resource)
        return setmetatable({}, {
            __index = function(_, fn)
                if _exports[resource] and _exports[resource][fn] then
                    return _exports[resource][fn]
                end
                return function() return nil end
            end,
        })
    end,
})

--- Register a mock export
function MockExport(resource, fn, impl)
    _exports[resource] = _exports[resource] or {}
    _exports[resource][fn] = impl
end

-- print stub (capture output) --------------------------------------------------

local _prints = {}

local _realPrint = print
print = function(...)
    local parts = {}
    for i = 1, select('#', ...) do
        parts[#parts + 1] = tostring(select(i, ...))
    end
    table.insert(_prints, table.concat(parts, '\t'))
end

function GetMockPrints()
    return _prints
end

function ClearMockPrints()
    _prints = {}
end
