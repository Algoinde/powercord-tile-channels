import { Injector, Logger, webpack, settings, common, util, components } from "replugged";

const inject = new Injector();
const logger = Logger.plugin("TileChannels");

import "./style.css";

const { ContextMenu } = components;
const { channels, guilds } = common;

export const SettingsValues = await settings.init("dev.Algoinde.TileChannels", {
  servers: [],
  guildMode: true,
  columns: 4,
});

const Navigate = webpack.getBySource("stageChannelSpeakerVoiceStates:");
const ChannelItem = webpack.getBySource(/\.unread,.*\.canHaveDot.*\.mentionCount.*\.relevant/);
const getGuild = webpack.getByProps("getGuildId");
const sidebar = webpack.getByProps("sidebar");

export async function start(): Promise<void> {
  inject.after(Navigate, "E", (_, res) => {
    let currentGuild: string = "0";
    if (currentGuild != getGuild.getGuildId()) {
      currentGuild = res.props.guildId;
      render();
    }

    //return _;
  });


  inject.after(ChannelItem, "Z", (_, res) => {
    let name = util.findInReactTree(res, (e) => e?.props?.channel?.name).props.channel.name;
    try {
      if (!name) return;
      let split = name
        .split("-")
        .filter((sp) => sp != "")
        .map((s) => Array.from(s));
      let s = "";
      switch (true) {
        case split.length == 4:
          s =
            (/^[\x00-\x7F]*$/.test(split[0][0]) ? split[0][0] : split[0][1] || "") +
            split[1][0] +
            split[2][0] +
            split[3][0];
          break;
        case split.length == 3:
          s =
            split[0][0] +
            (/^[\x00-\x7F]*$/.test(split[0][0]) ? "" : split[0][1] || "") +
            split[1][0] +
            split[2][0];
          break;
        case split.length == 2:
          s =
            split[0][0] +
            (/^[\x00-\x7F]*$/.test(split[0][0]) ? split[0][1] + "-" : split[0][1] || "") +
            split[1][0] +
            (SettingsValues.get("columns") > 4 ? "" : split[1][1] || "");
          break;
        default:
          if (split[0] && split[0].length < 5) s = split[0].join("");
          else
            s =
              (split[0] || [])
                .filter((ch, index) => !(/[aeiou]/.test(ch) && index > 0))
                .slice(0, SettingsValues.get("columns") > 4 ? 3 : 4)
                .join("") || "";
          break;
      }
      // console.log(s)
      // console.log(res.props.children.)
      name = s;
    } catch (e) {}
  });
}

function render(redraw) {
  if (!document.querySelector(".sidebar-1tnWFu")) return;
  let side = document.querySelector(".sidebar-1tnWFu");
  let serverMatch = queryServer();
  let columns = "c" + SettingsValues.get("columns");
  let c = ["c2", "c3", "c4", "c5", "c6"];
  if (serverMatch) {
    side.classList.add("tiles");
    c.forEach((c) => {
      side.classList[c == columns ? "add" : "remove"](c);
    });
  } else {
    side.classList.remove("tiles");
  }
  //if(redraw)forceUpdateElement('.containerDefault--pIXnN', true);
}

function queryServer() {
  let id = getGuild.getGuildId();
  //return SettingsValues.get("servers").includes(id) ^ SettingsValues.get("guildMode");
  return true
}

export function stop(): void {
  inject.uninjectAll();
}
