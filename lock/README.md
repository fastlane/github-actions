# Lock

An action for locking closed, inactive issues and pull requests.

# Usage 

See [action.yml](action.yml)

```yaml
name: Lock closed, inactive issues and pull requests
on:
  schedule:
  - cron: "0 0 * * *"

jobs:
  lock:
    runs-on: ubuntu-latest
    steps:
    - uses: fastlane/github-action/lock@latest
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)