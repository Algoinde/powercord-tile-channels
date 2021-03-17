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
		if(this.settings.get('servers') == undefined) {
			this.settings.set('servers', []);
		}
		if(this.settings.get('guildMode') == undefined) {
			this.settings.set('guildMode', true);
		}
		if(this.settings.get('columns') == undefined) {
			this.settings.set('columns', 4);
		}
	    powercord.api.settings.registerSettings('powercord-tile-channels', {
			category: this.entityID,
			label: 'TileChannels',
			render: (props) => React.createElement(Settings, {
				_render: this._render.bind(this),
				...props
			})
		});
		this.loadStylesheet('./main.css');
		this.checkBocks = [
			'<svg aria-hidden="false" class="icon-LYJorE" width="24" height="24" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.625 3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V5.375C21.0057 4.08803 19.9197 3 18.625 3ZM19 19V5H4.99999V19H19Z" fill="currentColor"></path></svg>',
			'<svg aria-hidden="false" class="icon-LYJorE" width="24" height="24" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.37499 3H18.625C19.9197 3 21.0056 4.08803 21 5.375V18.625C21 19.936 19.9359 21 18.625 21H5.37499C4.06518 21 3 19.936 3 18.625V5.375C3 4.06519 4.06518 3 5.37499 3Z" class="checkbox-3s5GYZ" fill="currentColor"></path><path d="M9.58473 14.8636L6.04944 11.4051L4.50003 12.9978L9.58473 18L19.5 8.26174L17.9656 6.64795L9.58473 14.8636Z" class="check-1JyqgN" fill="currentColor"></path></svg>'
		]

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
				return Math.round(res / self.settings.get('columns'));
			else
				return res;
		});

		inject('tile-channels-server-menu', Menu, 'default', (function(args, res) {
			if(res.props.id != 'guild-header-popout') return res;
			if(!findInReactTree(res, m => m.props && m.props.id == 'enable-tile-channels')) {
				this.checkbox = React.createElement(MenuCheckboxItem.MenuCheckboxItem, {
					id: "enable-tile-channels",
					key: "enable-tile-channels",
					label: "Enable Tile Channels",
					name: "Enable Tile Channels",
					color: "colorBrand",
					checked: this._queryServer(),
					action: () => {
						document.querySelector('#guild-header-popout-enable-tile-channels').children[1].children[0].innerHTML = this.checkBocks[this._toggleServer()];
						//I AM VERY SORRY, OKAY?!
					},
				});
			let children = findInReactTree(res, m => m[0] && Array.prototype.some.call(m, ch => ch && ch.props && ch.props.id == 'hide-muted-channels'))
				if(children) children.push(this.checkbox);
			}
			return res;
		}).bind(this))
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
						s = split[0][0] + ((/^[\x00-\x7F]*$/.test(split[0][0])) ? split[0][1] + '-' : split[0][1]) + split[1][0] + (this.settings.get('columns')>4?'':split[1][1]);
						break;
					default:
						if (split[0] && split[0].length < 5)
							s = split[0].join('');
						else
							s = (split[0] || []).filter((ch, index) => !(/[aeiou]/.test(ch) && index > 0)).slice(0, (this.settings.get('columns')>4?3:4)).join('') || '';
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
	let sidebar = document.querySelector('.sidebar-2K8pFh');
		this.serverMatch = this._queryServer();
	let columns = 'c'+this.settings.get('columns');
	let c = ['c2','c3','c4','c5','c6'];
		if(this.serverMatch) {
			sidebar.classList.add('tiles');
			c.forEach(c => {
				sidebar.classList[(c==columns?'add':'remove')](c);
			})
		}else{
			sidebar.classList.remove('tiles');
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