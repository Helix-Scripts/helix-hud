fx_version 'cerulean'
game 'gta5'

author 'Helix Scripts'
description 'Helix HUD'
version '0.1.0'

dependency 'helix_lib'

lua54 'yes'

client_scripts {
    'client/*.lua',
}

server_scripts {
    'server/*.lua',
}

shared_scripts {
    'shared/*.lua',
}

ui_page 'html/index.html'

files {
    'html/**/*',
}
