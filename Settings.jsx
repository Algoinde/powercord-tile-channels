const { React } = require('powercord/webpack');
const { getModule } = require('powercord/webpack');
const { SwitchItem } = require('powercord/components/settings');

module.exports = class Settings extends React.Component {
	constructor (props) {
		super(props);

		const get = props.getSetting;
		this.state = {
			guildMode: get('guildMode', {})
		};
	}

	async componentDidMount () {
		// this.setState({
		//   guildMode: ''
		// });
	}

	render () {
		const { getSetting, toggleSetting, _render } = this.props;
		return (
			<>
				<SwitchItem note='Use the server menu to enable/disable TileChannels for a specific server.'
					value={getSetting('guildMode', false)}
					onChange={() => {
						toggleSetting('guildMode');
						_render(true);
					}}
				>Enable TileChannels on all servers by default</SwitchItem>
			</>
		);
	}
};