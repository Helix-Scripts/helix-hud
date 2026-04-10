--- helix_hud server-side unit tests
--- Run with: busted tests/

-- Load mock natives before anything else
require('tests.helpers.natives')

describe('helix_hud server', function()

    -- Load the server script (registers events/threads)
    -- We need to load it once; handlers persist across tests.
    local loaded = false

    setup(function()
        if not loaded then
            -- Mock the bridge export used by server/main.lua
            -- Note: FiveM exports use : syntax, so Lua passes the proxy table as self
            MockExport('helix_lib', 'bridge_GetPlayer', function(_, src)
                if src == 1 then
                    return {
                        money = { cash = 5000, bank = 25000 },
                        job = { label = 'Police Officer' },
                    }
                elseif src == 2 then
                    return {
                        money = { cash = 100 },
                        job = { label = 'Unemployed' },
                    }
                elseif src == 99 then
                    -- Player with nil money/job fields
                    return {}
                end
                return nil
            end)

            dofile('server/main.lua')
            loaded = true
        end
    end)

    before_each(function()
        ClearTriggeredClientEvents()
        -- Advance time far enough to clear any rate limits from prior tests
        AdvanceMockTime(10)
    end)

    -- -----------------------------------------------------------------------
    -- Version print on startup
    -- -----------------------------------------------------------------------
    describe('startup', function()
        it('prints version on thread execution', function()
            ClearMockPrints()
            RunMockThreads()
            local prints = GetMockPrints()
            assert.is_true(#prints > 0, 'expected at least one print')

            local found = false
            for _, line in ipairs(prints) do
                if line:find('helix_hud') and line:find('v1.0.0') then
                    found = true
                    break
                end
            end
            assert.is_true(found, 'expected version print containing "helix_hud" and "v1.0.0"')
        end)
    end)

    -- -----------------------------------------------------------------------
    -- helix_hud:requestPlayerData
    -- -----------------------------------------------------------------------
    describe('requestPlayerData', function()
        it('sends player data to a valid player', function()
            FireNetEvent('helix_hud:requestPlayerData', 1)

            local events = GetTriggeredClientEvents()
            assert.equals(1, #events)
            assert.equals('helix_hud:playerData', events[1].event)
            assert.equals(1, events[1].target)

            local data = events[1].args[1]
            assert.equals(5000, data.cash)
            assert.equals(25000, data.bank)
            assert.equals('Police Officer', data.job)
        end)

        it('handles player with missing money.bank gracefully', function()
            FireNetEvent('helix_hud:requestPlayerData', 2)

            local events = GetTriggeredClientEvents()
            assert.equals(1, #events)

            local data = events[1].args[1]
            assert.equals(100, data.cash)
            -- bank should default to 0 since player.money.bank is nil
            assert.equals(0, data.bank)
            assert.equals('Unemployed', data.job)
        end)

        it('handles player with nil money and job fields', function()
            FireNetEvent('helix_hud:requestPlayerData', 99)

            local events = GetTriggeredClientEvents()
            assert.equals(1, #events)

            local data = events[1].args[1]
            assert.equals(0, data.cash)
            assert.equals(0, data.bank)
            assert.equals('', data.job)
        end)

        it('ignores requests from invalid source (0)', function()
            FireNetEvent('helix_hud:requestPlayerData', 0)

            local events = GetTriggeredClientEvents()
            assert.equals(0, #events)
        end)

        it('returns nil for unknown player', function()
            FireNetEvent('helix_hud:requestPlayerData', 999)

            local events = GetTriggeredClientEvents()
            assert.equals(0, #events)
        end)
    end)

    -- -----------------------------------------------------------------------
    -- Rate limiting
    -- -----------------------------------------------------------------------
    describe('rate limiting', function()
        it('blocks rapid repeated requests from same player', function()
            FireNetEvent('helix_hud:requestPlayerData', 1)
            ClearTriggeredClientEvents()

            -- Same player, same time — should be rate limited
            FireNetEvent('helix_hud:requestPlayerData', 1)

            local events = GetTriggeredClientEvents()
            assert.equals(0, #events)
        end)

        it('allows request after cooldown expires', function()
            FireNetEvent('helix_hud:requestPlayerData', 1)
            ClearTriggeredClientEvents()

            -- Advance time past the 5-second cooldown
            AdvanceMockTime(6)

            FireNetEvent('helix_hud:requestPlayerData', 1)

            local events = GetTriggeredClientEvents()
            assert.equals(1, #events)
        end)

        it('rate limits per player independently', function()
            FireNetEvent('helix_hud:requestPlayerData', 1)
            ClearTriggeredClientEvents()

            -- Different player should not be rate limited
            FireNetEvent('helix_hud:requestPlayerData', 2)

            local events = GetTriggeredClientEvents()
            assert.equals(1, #events)
            assert.equals(2, events[1].target)
        end)
    end)

    -- -----------------------------------------------------------------------
    -- playerDropped cleanup
    -- -----------------------------------------------------------------------
    describe('playerDropped', function()
        it('clears rate limit entry when player drops', function()
            -- First request from player 1
            FireNetEvent('helix_hud:requestPlayerData', 1)
            ClearTriggeredClientEvents()

            -- Simulate player drop (source=1)
            local oldSource = source
            source = 1
            FireEvent('playerDropped')
            source = oldSource

            -- Same player should now be allowed immediately (rate limit cleared)
            FireNetEvent('helix_hud:requestPlayerData', 1)

            local events = GetTriggeredClientEvents()
            assert.equals(1, #events)
        end)
    end)
end)

-- ---------------------------------------------------------------------------
-- Config validation
-- ---------------------------------------------------------------------------
describe('config.lua', function()
    it('loads without errors', function()
        assert.has_no.errors(function()
            dofile('config.lua')
        end)
    end)

    it('defines Config as a table', function()
        dofile('config.lua')
        assert.is_table(Config)
    end)

    it('has required top-level keys', function()
        dofile('config.lua')
        assert.is_not_nil(Config.framework)
        assert.is_table(Config.elements)
        assert.is_table(Config.vehicle)
        assert.is_string(Config.theme)
        assert.is_table(Config.updateIntervals)
    end)

    it('has expected element toggle keys', function()
        dofile('config.lua')
        local expected = { 'health', 'armor', 'hunger', 'thirst', 'stress', 'stamina', 'cash', 'job', 'serverId' }
        for _, key in ipairs(expected) do
            assert.is_not_nil(Config.elements[key], 'missing Config.elements.' .. key)
        end
    end)

    it('has valid vehicle config', function()
        dofile('config.lua')
        assert.is_boolean(Config.vehicle.enabled)
        assert.is_true(Config.vehicle.speedUnit == 'kmh' or Config.vehicle.speedUnit == 'mph',
            'speedUnit must be kmh or mph')
        assert.is_not_nil(Config.vehicle.fuelScript)
        assert.is_boolean(Config.vehicle.seatbelt)
    end)

    it('has valid update intervals', function()
        dofile('config.lua')
        assert.is_number(Config.updateIntervals.health)
        assert.is_number(Config.updateIntervals.vehicle)
        assert.is_true(Config.updateIntervals.health > 0, 'health interval must be positive')
        assert.is_true(Config.updateIntervals.vehicle > 0, 'vehicle interval must be positive')
    end)

    it('theme is a valid value', function()
        dofile('config.lua')
        local valid = { dark = true, light = true, auto = true }
        assert.is_true(valid[Config.theme] == true, 'theme must be dark, light, or auto')
    end)
end)
