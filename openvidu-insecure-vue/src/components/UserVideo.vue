<template>
<div v-if="streamManager">
	<ov-video :stream-manager="streamManager"/>
	<div><p>{{ clientData }}</p></div>
</div>
</template>

<script>
import OvVideo from './OvVideo';

export default {
	name: 'UserVideo',

	components: {
		OvVideo,
	},

	props: {
		streamManager: Object,
	},

	computed: {
		clientData () {
			const { clientData } = this.getConnectionData();
			return clientData;
		},
	},

	methods: {
		getConnectionData () {
			const { connection } = this.streamManager.stream;
      
      // 스트림 안 되는 문제 파악용 debug
      console.log(this.$el, connection)
			
      return JSON.parse(connection.data);
		},
	},
};
</script>
