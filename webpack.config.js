var webpack = require('atool-build/lib/webpack');

module.exports = function(webpackConfig) {
  webpackConfig.plugins.some(function(plugin, i){
    if(plugin instanceof webpack.optimize.CommonsChunkPlugin || plugin.constructor.name === 'CommonsChunkPlugin') {
      webpackConfig.plugins.splice(i, 1);
      return true;
    }
  });

  webpackConfig.module.loaders.push({
    test: /\.atpl?$/,
    loader: 'atpl-loader',
  });
  
  return webpackConfig;
};