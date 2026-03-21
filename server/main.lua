local lib = exports.helix_lib:getLib()

--- Perform a version check on resource start
CreateThread(function()
    lib.print.info(('helix-hud v%s loaded'):format(GetResourceMetadata(GetCurrentResourceName(), 'version', 0)))
end)
