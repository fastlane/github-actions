# Communicate on pull request merged

An action for adding comments and labels to a pull request which is merged.

# Usage 

See [action.yml](action.yml)

```yaml
steps:
- uses: fastlane/github-action/communicate-on-pull-request-merged@latest
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)