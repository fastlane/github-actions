# Communicate on pull request merged

An action for adding comments and labels to a pull request when it is merged.

# Usage 

See [action.yml](action.yml)

```yaml
steps:
- uses: fastlane/github-action/communicate-on-pull-request-merged@latest
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    pr-comment: "Hey @${{ github.event.pull_request.user.login }} :wave: Thank you for your contribution!"
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)