module.exports = {
  siteMetadata: {
    title: 'npm command-line interface',
    shortName: 'npm-cli',
    description: 'Documentation for the npm command-line interface',
    repo: {
      url: 'https://github.com/npm/cli',
      defaultBranch: 'release/v7.0.0-beta',
      path: 'docs'
    }
  },
  plugins: [
    {
      resolve: '@npm/gatsby-theme-doctocat',
      options: {
        icon: './src/images/npm-favicon.png'
      }
    }
  ]
}
