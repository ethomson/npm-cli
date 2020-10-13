const standardExports = {
  siteMetadata: {
    title: 'npm command-line interface',
    shortName: 'npm-cli',
    description: 'Documentation for the npm command-line interface',
    repo: {
      url: 'https://github.com/npm/cli',
      defaultBranch: 'latest',
      path: 'docs'
    },
    searchEnabled: false
  },
  plugins: [
    {
      resolve: 'gatsby-theme-doctornpm',
      options: {
        icon: './src/images/npm-favicon.png'
      }
    }
  ]
}

const staticExports = Object.assign({}, standardExports, {
  pathPrefix: '__GATSBY_RELATIVEURL_PATH_PREFIX__',
  plugins: standardExports.plugins.concat([ 'gatsby-plugin-relativeurl' ])
})

module.exports = process.env.GATSBY_IS_STATIC ? staticExports : standardExports
