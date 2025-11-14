# Communicate on pull request merged

An action for adding comments and labels to a pull request when it is merged.

# Usage 

See [action.yml](action.yml)

```yaml
steps:
- uses: fastlane/github-actions/communicate-on-pull-request-merged@latest
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    pr-comment: "Hey :wave: Thank you for your contribution!"
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)