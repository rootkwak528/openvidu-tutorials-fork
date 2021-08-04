// vue.config.js
module.exports = {
  // options...
  devServer: {
    disableHostCheck: true,
    proxy: 'https://i5a204.p.ssafy.io:8080/',
  },
}