const { React } = require('powercord/webpack');
const { getModule } = require('powercord/webpack');
const { SwitchItem, SliderInput } = require('powercord/components/settings');

module.exports = class Settings extends React.Component {
	constructor (props) {
		super(props);

		const get = props.getSetting;
		this.state = {
			guildMode: get('guildMode', {}),
      columns: get('columns', {}),
		};
	}

	async componentDidMount () {
		// this.setState({
		//   guildMode: ''
		// });
	}

	render () {
		const { getSetting, toggleSetting, updateSetting, _render } = this.props;
		return (
			<>
				<SwitchItem note='Use the server menu to enable/disable TileChannels for a specific server.'
					value={getSetting('guildMode', false)}
					onChange={() => {
						toggleSetting('guildMode');
						_render(true);
					}}
				>Enable TileChannels on all servers by default</SwitchItem>
        <SliderInput
          stickToMarkers
          initialValue={getSetting('columns', false)}
          minValue={ 2 }
          maxValue={ 6 }
          markers={[ 2, 3, 4, 5, 6 ]}
          onValueChange={(col) => {
            updateSetting('columns', col);
            _render(true);
          }}
        >Number of columns</SliderInput>
			</>
		);
	}
};