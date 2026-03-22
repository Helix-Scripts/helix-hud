fx_version('cerulean')
game('gta5')

name('helix_hud')
description('High-performance HUD for FiveM — sub-0.05ms idle resmon')
author('Helix Scripts')
version('0.1.0')
repository('https://github.com/Helix-Scripts/helix-hud')

lua54('yes')

dependency('helix_lib')

shared_scripts({
    'config.lua',
})

client_scripts({
    'client/utils.lua',
    'client/status.lua',
    'client/vehicle.lua',
    'client/main.lua',
})

server_scripts({
    'server/main.lua',
})

ui_page('html/index.html')

files({
    'html/index.html',
    'html/assets/**/*',
})

exports({
    'setVisible',
    'isVisible',
})
