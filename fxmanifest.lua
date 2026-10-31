name 'ai-sirens'
author 'TGIANN'
version '0.1.0'
license 'GPL-3.0-only'
description 'Emergency vehicle lights, siren tones, airhorn and ONX lightbars'
repository 'https://github.com/aifivem/ai-sirens'
fx_version 'cerulean'
game 'gta5'
node_version '22'

client_script 'dist/client.js'
server_script 'dist/server.js'


dependencies {
	'/onesync',
	'ai-core',
}

files {
	'locales/*.json',
}
