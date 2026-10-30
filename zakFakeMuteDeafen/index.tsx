/*
 * Fake Mute/Deafen, an Equicord userplugin
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { UserAreaButton, UserAreaRenderProps } from "@api/UserArea";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { ChannelStore, ContextMenuApi, MediaEngineStore, Menu, React, SelectedChannelStore } from "@webpack/common";

/* ===========================
 * Store lookups (The gateway socket getter thingy.)
 * =========================== */

const GatewayConnectionStore = findStoreLazy("GatewayConnectionStore") as {
    getSocket(): {
        voiceStateUpdate(state: {
            guildId: string | null;
            channelId: string;
            selfMute: boolean;
            selfDeaf: boolean;
            selfVideo: boolean;
        }): void;
    } | null;
};

let suspended = false;

/* ===========================
 * Plugin settings (They don't really exist tbh because they're hidden.)
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
    // Master toggle?? I'm getting sick of adding comments to my shit. (as of 10/30/2026, I'm still adding comments.)
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
    try {
        const channelId = SelectedChannelStore.getVoiceChannelId();
        if (!channelId) return;

        const channel = ChannelStore.getChannel(channelId);
        if (!channel) return;

        const socket = GatewayConnectionStore.getSocket();
        if (!socket || typeof socket.voiceStateUpdate !== "function") return;

        socket.voiceStateUpdate({
            guildId: channel.guild_id ?? null,
            channelId: channel.id,
            selfMute: MediaEngineStore.isSelfMute(),
            selfDeaf: MediaEngineStore.isSelfDeaf(),
            selfVideo: MediaEngineStore.isVideoEnabled()
        });
    } catch (e) {
        console.error("[FakeMuteDeafen] Send Failed:", e);
    }
}

function shouldFakeMute(real: boolean) {
    return !suspended && settings.store.active && settings.store.fakeMuteEnabled ? true : real;
}

function shouldFakeDeaf(real: boolean) {
    return !suspended && settings.store.active && settings.store.fakeDeafEnabled ? true : real;
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
                match: /self_mute:([^,]+),self_deaf:([^,]+),self_video:([^,]+)/,
                replace: "self_mute:$self.shouldFakeMute($1),self_deaf:$self.shouldFakeDeaf($2),self_video:$3"
            }
        },
        {
            find: ".merge({selfMute:",
            replacement: {
                match: /\i\.sessionId===\i(?=\?)/,
                replace: "$&&&!$self.shouldShowFakeVoiceState()"
            }
        }
    ],

    shouldFakeMute,
    shouldFakeDeaf,
    shouldShowFakeVoiceState: () => !suspended && settings.store.active,

    start() {
        suspended = false;
    },

    stop() {
        suspended = true;
        triggerGatewayUpdate();
    }
});
