const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro');
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch shared packages
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/ui'),
  path.resolve(workspaceRoot, 'packages/ai-components'),
  path.resolve(workspaceRoot, 'packages/supabase'),
]

// Only allow Metro to compile these extensions
config.resolver.assetExts.push('cjs')

config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
]

config.resolver.extraNodeModules = {
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
}

module.exports = config
module.exports = withNativeWind(config, { input: './styles/tailwind.css' })
