<div align="center">

# Fake Mute/Deafen

**Look muted and deafened to everyone else in a voice call, while you can still hear and speak.**

One button next to your mute and deafen buttons turns it on and off. Right-click it to choose whether it fakes mute, deafen, or both.

<img src="https://img.shields.io/badge/Platform-Discord%20%28Equicord%29-5865f2?style=flat-square&labelColor=161B22" alt="Platform: Discord with Equicord">
<img src="https://img.shields.io/badge/License-GPL--3.0--or--later-bd0000?style=flat-square&labelColor=161B22" alt="License: GPL-3.0-or-later">

</div>

---

> [!WARNING]
> Spoofing your voice state is a client modification, and client mods go against [Discord's Terms of Service](https://discord.com/terms). Use this at your own risk.

## Installation

> [!IMPORTANT]
> This is a userplugin for [Equicord](https://github.com/Equicord/Equicord). Userplugins are compiled into the client, so you **must build Equicord from source**. The prebuilt [Equilotl](https://github.com/Equicord/Equilotl) installers and [Equibop](https://github.com/Equicord/Equibop/releases) releases can't load it on their own.

### 1. Build Equicord from source

You need [Git](https://git-scm.com/downloads), [Node.js](https://nodejs.org/en/download/) and [pnpm](https://pnpm.io/installation), all on your `PATH`. Check with `git --version`, `node --version` and `pnpm --version`.

```bash
git clone https://github.com/Equicord/Equicord
cd Equicord
pnpm install --frozen-lockfile
```

Use `pnpm`, not `npm` or `yarn`. The full walkthrough is in the Equicord docs under [Building from Source](https://docs.equicord.org/installing/#building-from-source).

### 2. Install the plugin

Create a `src/userplugins` folder in the checkout if it doesn't exist, then put this plugin in a `FakeMuteDeafen` subfolder so the file ends up at `src/userplugins/FakeMuteDeafen/index.tsx`. `index.tsx` is the only file you need. See [Installing Custom Plugins](https://docs.equicord.org/installing/custom-plugin/) for more on how userplugins work.

### 3. Build and inject it

Build Equicord with the plugin included:

```bash
pnpm build
```

After it's built, inject it into your Discord install:

```bash
pnpm inject
```

This opens the Equilotl installer. Select the Discord install you want to patch and you're done.

### 4. Enable it

Turn the plugin on under **Settings**, **Equicord**, **Plugins**, **Fake Mute/Deafen**, then fully restart Discord.

> [!NOTE]
> The Equicord team [doesn't support userplugins](https://docs.equicord.org/installing/custom-plugin/), so please don't ask them for help with this one. If something breaks, check that the file is named `index.tsx`, that `pnpm build` finished without errors, and that Discord was fully restarted. Still stuck? Check the Equicord [FAQ](https://docs.equicord.org/faq).

## Usage

- **Left-click the button** to turn the fake on or off. The button shows a red slash while the fake is off.
- **Right-click the button** to open the options:
  - **Fake Mute:** other people see you as muted.
  - **Fake Deafen:** other people see you as deafened.
- If you turn only one of them on, the other keeps showing your real state.
- Changes apply straight away if you are in a voice channel, and when you join one later.
- Your choices are saved, so they survive a restart.
- Turning the plugin off releases the fake and sends your real mute and deafen state.

> [!TIP]
> The plugin has no settings page. Everything is on the button.

## How it works

Discord tells the server your mute and deafen state through a voice state update. The plugin patches the function that builds that update, so while the fake is on it reports `self_mute` and `self_deaf` as `true` for the options you chose. Your own audio is not touched, which is why you still hear and speak.

Turning the button or an option on or off asks Discord to send a fresh voice state update through the same patched function, so the new state reaches the server straight away.

## Notes

> [!IMPORTANT]
> **Built for Equicord.** It uses Equicord's userplugin setup and has only been tested there. It is built on the [Vencord](https://github.com/Vendicated/Vencord) plugin API, so it may run on Vencord or other forks, but that is untested and it may need changes.

## Credits

| Who | What |
|---|---|
| [**Zak**](https://github.com/ZakJavaScript) | Author and maintainer of the Fake Mute/Deafen plugin. |
| [**The Equicord team and contributors**](https://github.com/Equicord/Equicord/graphs/contributors) | [Equicord](https://github.com/Equicord/Equicord), the client mod this plugin runs on, plus [Equilotl](https://github.com/Equicord/Equilotl), [Equibop](https://github.com/Equicord/Equibop) and the [documentation](https://docs.equicord.org/). |
| [**Vendicated and the Vencord contributors**](https://github.com/Vendicated/Vencord/graphs/contributors) | [Vencord](https://github.com/Vendicated/Vencord), the project Equicord is forked from, and the plugin API this plugin uses. |

## License

[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html), matching the header in `index.tsx`.

Not affiliated with Discord, Equicord or Vencord.
