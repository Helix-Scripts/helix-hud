# Helix HUD

A modern, customizable HUD for FiveM servers built with React and TypeScript, powered by [helix_lib](https://github.com/helix-scripts/helix-lib).

## Features

- Health, armor, hunger, thirst, and stress indicators
- Smooth animated status bars
- Lightweight React-based NUI
- Configurable update interval and visibility toggles
- Integrated with helix_lib configuration system

## Dependencies

- [helix_lib](https://github.com/helix-scripts/helix-lib) - Required shared library

## Installation

1. Ensure `helix_lib` is installed and started before this resource.
2. Clone or download this repository into your server's `resources/` directory.
3. Build the NUI:
   ```bash
   cd nui
   npm install
   npm run build
   ```
4. Add `ensure helix-hud` to your `server.cfg` (after `ensure helix_lib`).

## Configuration

Edit `config.lua` to toggle HUD elements and adjust the update interval:

| Option           | Type    | Default | Description                          |
|------------------|---------|---------|--------------------------------------|
| `ShowHealth`     | boolean | `true`  | Display the health bar               |
| `ShowArmor`      | boolean | `true`  | Display the armor bar                |
| `ShowHunger`     | boolean | `true`  | Display the hunger bar               |
| `ShowThirst`     | boolean | `true`  | Display the thirst bar               |
| `ShowStress`     | boolean | `true`  | Display the stress bar               |
| `UpdateInterval` | number  | `200`   | Status update frequency (ms)         |

## Contributing

Please see the [organisation contributing guidelines](https://github.com/Helix-Scripts/.github/blob/main/CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](LICENSE).
