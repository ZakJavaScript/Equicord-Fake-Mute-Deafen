# Fake Mute/Deafen

**Look muted and deafened to everyone else in a voice call, while you can still hear and speak.**

One button next to your mute and deafen buttons turns it on and off. Right-click it to choose whether it fakes mute, deafen, or both.

---

## Installation

This is a source plugin. You build it into the client yourself.

1. Set up an Equicord source checkout with Node.js and pnpm, as its own docs describe.
2. Put the plugin in the `userplugins` folder. Open `src` in the checkout, create a `userplugins` folder there if it doesn't exist, and copy this folder into it so the file ends up at `src/userplugins/FakeMuteDeafen/index.tsx`. `index.tsx` is the only file you need.
3. From the checkout, run `pnpm build`, then inject it into Discord the way Equicord's docs describe.
4. Restart Discord, then turn the plugin on under **Settings**, **Equicord**, **Plugins**, **Fake Mute/Deafen**.

## Usage

- **Left-click the button** to turn the fake on or off. The button shows a red slash while the fake is off.
- **Right-click the button** to open the options:
  - **Fake Mute:** other people see you as muted.
  - **Fake Deafen:** other people see you as deafened.
- If you turn only one of them on, the other keeps showing your real state.
- Changes apply straight away if you are in a voice channel, and when you join one later.
- Your choices are saved, so they survive a restart.
- Turning the plugin off releases the fake and sends your real mute and deafen state.

The plugin has no settings page. Everything is on the button.

## How it works

Discord tells the server your mute and deafen state through a voice state update. The plugin patches the function that builds that update, so while the fake is on it reports `self_mute` and `self_deaf` as `true` for the options you chose. Your own audio is not touched, which is why you still hear and speak.

Turning the button or an option on or off asks Discord to send a fresh voice state update through the same patched function, so the new state reaches the server straight away.

## Credits

- **Author and maintainer:** [Zak](https://github.com/ZakJavaScript)

| Who | What |
|---|---|
| **Zak** | The Fake Mute/Deafen plugin developer. |
| **Vendicated and contributors** | The Vencord plugin API that Equicord is built on. |

## License

GPL-3.0-or-later, matching the header in `index.tsx`.

Not affiliated with Discord, Equicord or Vencord.