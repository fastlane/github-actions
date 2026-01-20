# Communicate on pull request merged

An action for adding comments and labels to a pull request and referenced issue when the pull request is released.

# Usage 

See [action.yml](action.yml)

```yaml
steps:
- uses: fastlane/github-actions/communicate-on-pull-request-released@latest
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
```

# License

The scripts and documentation in this project are released under the [MIT License](../LICENSE)
