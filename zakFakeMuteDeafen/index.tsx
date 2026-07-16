/*
 * Vencord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { UserAreaButton, UserAreaRenderProps } from "@api/UserArea";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps } from "@webpack";
import { ChannelStore, ContextMenuApi, Menu, React, SelectedChannelStore } from "@webpack/common";

/* ===========================
 * Store lookups (Found at some point. Not really my fucking problem.)
 * =========================== */

let VoiceStateStore, MediaEngineStore, GatewayConnectionStore, SelectedGuildStore;

const safeFind = (...props: string[]) => {
    try { return findByProps(...props); } catch { return null; }
};

function loadStores() {
    if (!VoiceStateStore) VoiceStateStore = safeFind("getVoiceChannelId");
    if (!MediaEngineStore) MediaEngineStore = safeFind("isSelfMute");
    if (!GatewayConnectionStore) GatewayConnectionStore = safeFind("getSocket");
    if (!SelectedGuildStore) SelectedGuildStore = safeFind("getLastSelectedGuildId");
}

/* ===========================
 * Plugin settings (They don't really exist tbh)
 * =========================== */

const settings = definePluginSettings({
    // Set from the context-menu.
    fakeMuteEnabled: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Include fake mute when active",
        hidden: true
    },
    fakeDeafEnabled: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Include fake deafen when active",
        hidden: true
    },
    // Master toggle?? I'm getting sick of adding comments to my shit.
    active: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Fake mute/deafen active",
        hidden: true
    }
});

/* ===========================
 * Gateway pusher (Just makes shit work. Too lazy to explain, but I'll put this here anyways because I'm a smart-ass.)
 * =========================== */

function triggerGatewayUpdate() {
    loadStores();
    if (!VoiceStateStore || !GatewayConnectionStore) return;

    const channelId = VoiceStateStore.getVoiceChannelId();
    if (!channelId) return;

    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return;

    let guildId = channel.guild_id;
    if (!guildId && (channel.type === 2 || channel.type === 13)) {
        if (SelectedGuildStore) guildId = SelectedGuildStore.getLastSelectedGuildId();
        if (!guildId) return;
    }

    const socket = GatewayConnectionStore.getSocket();
    if (!socket || typeof socket.send !== "function") return;

    const realMute = MediaEngineStore ? MediaEngineStore.isSelfMute() : false;
    const realDeaf = MediaEngineStore ? MediaEngineStore.isSelfDeaf() : false;
    const realVideo = MediaEngineStore ? MediaEngineStore.isVideoEnabled() : false;

    try {
        socket.send(4, {
            guild_id: guildId,
            channel_id: channelId,
            self_mute: shouldFakeMute(realMute),
            self_deaf: shouldFakeDeaf(realDeaf),
            self_video: realVideo
        });
    } catch (e) {
        console.error("[FakeMuteDeafen] Send Failed:", e);
    }
}

function shouldFakeMute(real: boolean) {
    return settings.store.active && settings.store.fakeMuteEnabled ? true : real;
}

function shouldFakeDeaf(real: boolean) {
    return settings.store.active && settings.store.fakeDeafEnabled ? true : real;
}

/* ===========================
 * Icon (SVG thing that looks cool!)
 * =========================== */

function FakeAudioIcon({ className }: { className?: string }) {
    const { active } = settings.use(["active"]);
    const isActive = active;

    const redLinePath =
        "M22.7 2.7a1 1 0 0 0-1.4-1.4l-20 20a1 1 0 1 0 1.4 1.4Z";
    const maskBlackPath =
        "M23.27 4.73 19.27 .73 -.27 20.27 3.73 24.27Z";

    return (
        <svg
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isActive ? "currentColor" : "var(--status-danger)"}
        >
            {!isActive && (
                <>
                    <mask id="fakeAudioMask">
                        <rect fill="white" width="24" height="24" />
                        <path fill="black" d={maskBlackPath} />
                    </mask>
                    <path fill="var(--status-danger)" d={redLinePath} />
                </>
            )}

            <g mask={!isActive ? "url(#fakeAudioMask)" : void 0}>
                <rect x="1" y="10" width="2" height="4" rx="1" />
                <rect x="5" y="6" width="2" height="12" rx="1" />
                <rect x="9" y="3" width="2" height="18" rx="1" />
                <rect x="13" y="8.5" width="2" height="7" rx="1" />
                <rect x="17" y="5.5" width="2" height="13" rx="1" />
                <rect x="21" y="10" width="2" height="4" rx="1" />
            </g>
        </svg>
    );
}

/* ===========================
 * Context Menu (You right-click and boom boom..)
 * =========================== */

function FakeAudioContextMenu() {
    const { fakeMuteEnabled, fakeDeafEnabled } = settings.use(["fakeMuteEnabled", "fakeDeafEnabled"]);

    return (
        <Menu.Menu
            navId="fake-audio-context-menu"
            onClose={() => { }}
            aria-label="Fake Mute/Deafen Settings"
        >
            <Menu.MenuCheckboxItem
                id="fake-audio-mute"
                label="Fake Mute"
                checked={fakeMuteEnabled}
                action={() => {
                    settings.store.fakeMuteEnabled = !fakeMuteEnabled;
                    triggerGatewayUpdate();
                }}
            />
            <Menu.MenuCheckboxItem
                id="fake-audio-deafen"
                label="Fake Deafen"
                checked={fakeDeafEnabled}
                action={() => {
                    settings.store.fakeDeafEnabled = !fakeDeafEnabled;
                    triggerGatewayUpdate();
                }}
            />
        </Menu.Menu>
    );
}

/* ===========================
 * Button (You press it I think.)
 * =========================== */

function FakeAudioButton({
    iconForeground,
    hideTooltips,
    nameplate
}: UserAreaRenderProps) {
    const { active } = settings.use(["active"]);
    const isActive = active;
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handler = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            ContextMenuApi.openContextMenu(e as any, () => <FakeAudioContextMenu />);
        };
        el.addEventListener("contextmenu", handler, true);
        return () => el.removeEventListener("contextmenu", handler, true);
    }, []);

    const toggleActive = () => {
        settings.store.active = !active;
        triggerGatewayUpdate();
    };

    return (
        <div ref={ref} style={{ display: "contents" }}>
            <UserAreaButton
                tooltipText={
                    hideTooltips
                        ? void 0
                        : isActive
                            ? "Disable Fake Mute/Deafen (right-click for options)"
                            : "Enable Fake Mute/Deafen (right-click for options)"
                }
                icon={<FakeAudioIcon className={iconForeground} />}
                role="switch"
                aria-checked={isActive}
                redGlow={!isActive}
                plated={nameplate != null}
                onClick={toggleActive}
            />
        </div>
    );
}

/* ===========================
 * Plugin (Kind of a big deal or something like that.)
 * =========================== */

export default definePlugin({
    name: "Fake Mute/Deafen",
    description: "Fake being muted/deafened while still hearing and speaking. Right-click the button for options.",
    authors: [{ name: "Zak", id: 223472303000911873n }],
    tags: ["Voice", "Shortcuts"],
    dependencies: ["UserAreaAPI"],

    settings,

    userAreaButton: {
        icon: FakeAudioIcon,
        render: FakeAudioButton
    },

    // This is where the magic happens (Not really magic..)
    patches: [
        {
            find: "}voiceStateUpdate(",
            replacement: {
                match: /self_mute:([^,]+),self_deaf:([^,]+)/,
                replace: "self_mute:$self.shouldFakeMute($1),self_deaf:$self.shouldFakeDeaf($2)"
            }
        }
    ],

    shouldFakeMute,
    shouldFakeDeaf,

    start() {
        loadStores();
    }
});