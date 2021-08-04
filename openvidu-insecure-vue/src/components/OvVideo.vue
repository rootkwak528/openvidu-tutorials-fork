<template>
	<video autoplay/>
</template>

<script>
export default {
	name: 'OvVideo',

	props: {
		streamManager: Object,
	},

	mounted () {
    // this.streamManager.addVideoElement(this.$el);

    // 스트림 안 되는 문제 파악용 debug
		const addVideoElementStatus = this.streamManager.addVideoElement(this.$el);
    console.log(this.$el, addVideoElementStatus)
	},
};
</script>
