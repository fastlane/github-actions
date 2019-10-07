# Pull Request Release Lifecycle

An action for adding comments and labels to a pull request during the release lifecycle (code changes merged and released).

# Usage 

See [action.yml](action.yml)

```yaml
steps:
- uses: fastlane/github-action/pr-release-lifecycle@latest
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)