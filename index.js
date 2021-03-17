const {
	Plugin
} = require('powercord/entities');
const {
	React,
	getModule,
	getAllModules,
	getModuleByDisplayName
} = require('powercord/webpack');
const {
	inject,
	uninject
} = require('powercord/injector');
const { forceUpdateElement, findInReactTree } = require('powercord/util')
const {
	Tooltip
} = require('powercord/components');

const Settings = require('./Settings');
const getGuild = getModule(["getGuildId","getLastSelectedGuildId"], false);

module.exports = class TileChannels extends Plugin {
	constructor() {
		super();
	}

	async startPlugin() {
	    powercord.api.settings.registerSettings('powercord-tile-channels', {
			category: this.entityID,
			label: 'TileChannels',
			render: (props) => React.createElement(Settings, {
				_render: this._render.bind(this),
				...props
			})
		});
		this.loadStylesheet('./main.css');
		if(this.settings.get('servers') == undefined) {
			this.settings.set('servers', []);
		}

		const ScrollObject = await getModule(m => m && m.default && m.default.prototype && m.default.prototype.getHeightForFooter);
		const NavigableChannels = await getModule(m => m.default && m.default.displayName == 'NavigableChannels');
		const ChannelItem = await getModule(m => m.default ?.displayName === 'ChannelItem');
		const Menu = await getModule(m => m.default ?.displayName === 'Menu');
		const MenuCheckboxItem = await getModule(['MenuCheckboxItem']);


		inject('tile-channels-update', NavigableChannels, 'default', (_, res) => {
			if(this.currentServer != getGuild.getGuildId()) {
				this.currentServer = getGuild.getGuildId();
				this._render();
			}

			return _;
		}, true);
		NavigableChannels.default.displayName = 'NavigableChannels';

		const self = this;
		inject('tile-channels-rowHeight', ScrollObject.default.prototype, 'getHeightForRow', function(_, res) {
			if(!self.serverMatch) return res;
			if (typeof this.rowHeight == 'function')
				return Math.round(res / 4);
			else
				return res;
		});

		inject('tile-channels-server-menu', Menu, 'default', (function(args, ret) {
			if(args[0].navId != 'guild-header-popout') return args;
			// console.log(args,ret,ChannelItem);
			if(!findInReactTree(args[0],m => m.id == 'enable-tile-channels')) {
				this.checkbox = React.createElement(MenuCheckboxItem.MenuCheckboxItem, {
					id: "enable-tile-channels",
					key: "enable-tile-channels",
					label: "Enable Tile Channels",
					name: "Enable Tile Channels",
					color: "colorBrand",
					checked: this._queryServer(),
					action: () => {
						this.checkbox.props.checked = this._toggleServer();
						// this.checkbox.forceUpdate();
					},
				});
			let children = findInReactTree(args[0], m => m[0] && Array.prototype.some.call(m, ch => ch && ch.props && ch.props.id == 'hide-muted-channels'))
				if(children) children.push(this.checkbox);
			}
			return args;
		}).bind(this),true)
		Menu.default.displayName = 'Menu';


		inject('tile-channels-rename', ChannelItem, 'default', (args, res) => {
			if(!this.serverMatch) return res;
		let name = res.props.children.props.children[1].props.children[0].props.children[1].props.children[0];
			try{
				if (!name) return res;
				var split = name.split('-').filter(sp => sp != '').map(s => Array.from(s));
				var s = '';
				switch (true) {
					case split.length == 4:
						s = ((/^[\x00-\x7F]*$/.test(split[0][0])) ? split[0][0] : split[0][1]) + split[1][0] + split[2][0] + split[3][0];
						break;
					case split.length == 3:
						s = split[0][0] + ((/^[\x00-\x7F]*$/.test(split[0][0])) ? '' : split[0][1] || '') + split[1][0] + split[2][0];
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
				res.props.children.props.children[1].props.children[0].props.children[1].props.children[0] = s;
			} catch (e) {
				console.error('[TileChannels]:', e)
			}

			const Popout = React.createElement(Tooltip, {
				text: args[0].channel.name,
				position: 'top',
				color: "primary",
				delay: 200,
				disableTooltipPointerEvents: true,
			}, res)
			return Popout;
		});
		ChannelItem.default.displayName = 'ChannelItem';
	}

	_render(redraw) {
		if(!document.querySelector('.sidebar-2K8pFh')) return;
		this.serverMatch = this._queryServer();
		if(this.serverMatch) {
			document.querySelector('.sidebar-2K8pFh').classList.add('tiles');
		}else{
			document.querySelector('.sidebar-2K8pFh').classList.remove('tiles');
		}
		if(redraw)forceUpdateElement('.containerDefault--pIXnN', true);
	}

	_toggleServer(state) {
	let id = getGuild.getGuildId();
	let serverArray = this.settings.get('servers');
	let idx = serverArray.indexOf(id);
		if(idx > -1) {
			serverArray.splice(idx, 1);
		}else{
			serverArray.push(id)
		}
		this.settings.set('servers', serverArray);
		this._render(true);
		return this._queryServer();
	}

	_queryServer() {
	let id = getGuild.getGuildId()
		return this.settings.get('servers').includes(id) ^ this.settings.get('guildMode');
	}

	pluginWillUnload() {
		powercord.api.settings.unregisterSettings('powercord-tile-channels');
		uninject('tile-channels-server-menu');
		uninject('tile-channels-rowHeight');
		uninject('tile-channels-rename');
		uninject('tile-channels-update');
	}
};