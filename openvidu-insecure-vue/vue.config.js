// vue.config.js
module.exports = {
  // options...
  devServer: {
    disableHostCheck: true,
    proxy: 'https://i5a204.p.ssafy.io:8080/',
    headers: {
      'Access-Control-Allow-Origin': '*',
      //'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
    https: true,
  },
}
