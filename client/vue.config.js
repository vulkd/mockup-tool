module.exports = {
	devServer: {
	  host: 'localhost'
	},
	lintOnSave: false,
	productionSourceMap: false,
	transpileDependencies: [
		/\bvue-awesome\b/u
	],
	configureWebpack: (config) => {
		config.devtool = 'source-map'
		config.watchOptions = {
			ignored: /node_modules/u
		}
	}
};
