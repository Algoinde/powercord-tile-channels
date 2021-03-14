const {
	Plugin
} = require('powercord/entities');
const {
	getModule,
	getAllModules,
	getModuleByDisplayName
} = require('powercord/webpack');
const {
	inject,
	uninject
} = require('powercord/injector');

// const Settings = require('./Settings');

module.exports = class TileChannels extends Plugin {
	constructor() {
		super();
	}

	async startPlugin() {
		// powercord.api.settings.registerSettings('alg-channels', {
		//   category: this.entityID,
		//   label: 'TileChannels',
		//   render: Settings
		// });
		var style = document.createElement('style');
		style.innerText = `
#channels .containerDefault--pIXnN {
	width: 25%;
}

#channels .containerDefault-3tr_sE {
	width: 100%;
}

#channels .content-3YMskv {
	display: flex;
	justify-content: flex-start;
	flex-wrap: wrap;
	align-content: start;
	align-items: flex-start;
}
#channels .content-3YMskv > div:first-child {
	width: 100%;
}


#channels .children-3rEycc .iconBase-3LOlfs {
	display: none;
}

#channels .iconContainer-1BBaeJ {
	display: none;
}

#channels a.mainContent-u_9PKf[aria-label*="mention"]:before {
	display: block;
	border-radius: 4px;
	box-shadow: 0 0 10px 8px rgba(255,0,0,0.2) inset;
	pointer-events: none;
}

#channels .name-23GUGE.overflow-WK9Ogt {
	text-overflow: clip;
	font-size: 0.9em;
}
#channels .mainContent-u_9PKf .name-23GUGE.overflow-WK9Ogt:after {
	content: attr(data-original);
	position: absolute;
	visibility: hidden;
}

#channels .iconVisibility-sTNpHs.wrapper-2jXpOf.modeUnread-1qO3K1 .unread-2lAfLh {
	display: none;
}

#channels .iconVisibility-sTNpHs.wrapper-2jXpOf.modeUnread-1qO3K1 .content-1x5b-n {
	/* background: rgba(0,0,0,0.08); */
	box-shadow: 0 0 9px 9px #2f3136ff inset, 0 0 0 50px rgba(255,255,255,0.04) inset;
	/* border-radius: 6px; */
}
#channels .iconVisibility-sTNpHs.wrapper-2jXpOf.modeUnread-1qO3K1 .content-1x5b-n:hover {
		box-shadow: none;
}

#channels .content-1x5b-n {
	text-align: center;
	padding: 0 2px;
}
#channels .list-2luk8a.list-SuzGBZ.listDefault-3ir5aS {
	padding-left: 0;
}

#channels .avatarContainer-28iYmV.avatar-3tNQiO.avatarSmall-1PJoGO {
	margin-right: -27px;
	z-index: -1;
	opacity: 0.3;
}
.modeUnread-1qO3K1 a.mainContent-u_9PKf[aria-label*="elysium"],
.modeUnread-1qO3K1 a.mainContent-u_9PKf[aria-label*="discipl"],
.modeUnread-1qO3K1 a.mainContent-u_9PKf[aria-label*="committ"],
.modeUnread-1qO3K1 a.mainContent-u_9PKf[aria-label*="popo-ch"] {
	box-shadow: 0px 0px 6px 4px rgba(78, 189, 255, 0.21) inset;
	border-radius: 4px;
}
.emoji-negative {
	text-indent: -4px;
}
.channel-typing {
    position: absolute;
    bottom: -1px;
    left: 50%;
    height:12px;
    transform: translateX(-52%) scale(0.9);
    overflow: hidden;
}
`;

		this.style = document.body.appendChild(style);

		const channels = await getModule(function(e) {
			if (e && e.default && e.default.prototype && e.default.prototype.getHeightForFooter) return true;
		})
		const NavigableChannels = await getModule(m => m.default && m.default.displayName == 'NavigableChannels');

		inject('alg-channels-rowHeight', channels.default.prototype, 'getHeightForRow', (_, res) => {
			return res / 4;
		});

		inject('alg-channels-compute', NavigableChannels, 'default', (_, res) => {
			if (!document.getElementById('channels')) return res;
			setTimeout(() => {
				if(!document.getElementById('channels')) return;
				Array.prototype.forEach.call(document.getElementById('channels').querySelectorAll(`.name-23GUGE.overflow-WK9Ogt`), item => {
					if (!item) return res;
					if (item.edited) return res;
					item.edited = true;
					item.setAttribute('data-original', item.innerText);
					try {
						var split = item.innerText.split('-').filter(sp => sp != '').map(s => Array.from(s));
						if (split[0] && split[0][0] && split[0][0].length > 1) item.classList.add('emoji-negative');
						else item.classList.remove('emoji-negative');
						var s = '';
						switch (true) {
							case split.length == 4:
								s = ((/^[\x00-\x7F]*$/.test(split[0][0])) ? split[0][0] : split[0][1]) + split[1][0] + split[2][0] + split[3][0];
								break;
							case split.length == 3:
								s = split[0][0] + ((/^[\x00-\x7F]*$/.test(split[0][0])) ? '' : split[0][1]) + split[1][0] + split[2][0];
								break;
							case split.length == 2:
								s = split[0][0] + ((/^[\x00-\x7F]*$/.test(split[0][0])) ? split[0][1] + '-' : split[0][1]) + split[1][0] + split[1][1];
								break;
							default:
								if (split[0] && split[0].length < 5)
									s = split[0].join('');
								else
									s = (split[0] || []).filter((ch, index) => !(/[aeiou]/.test(ch) && index > 0)).slice(0, 4).join('') || '';
								break;
						}
						item.innerText = s;
					} catch (e) {
						console.error('[TileChannels]:', e)
					}
				})
			}, 5);
			return res;
		})

	}

	pluginWillUnload() {
		uninject('alg-channels-compute');
		uninject('alg-channels-rowHeight');
		document.body.removeChild(this.style);
	}
};