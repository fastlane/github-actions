## Fastlane GitHub Actions

The Fastlane GitHub Actions provide a set of GitHub Actions to make maintaining projects easier.

## Actions

- 🌏 [@github-actions/fastlane-env-reminder](fastlane-env-reminder)

   Adds a comment to include _fastlane_ environment information in an issue description if it is missing. Read more [here](fastlane-env-reminder).
   
- ✔️ [@github-actions/communicate-on-pull-request-merged](communicate-on-pull-request-merged)

   Adds a comment and a label to a pull request when it is merged. Read more [here](communicate-on-pull-request-merged).

## Versioning 

All the actions are released in one batch. We do not support semantic versioning (yet). Reference a `latest` branch in your workflow:

```yaml
...
  - uses: fastlane/github-actions/fastlane-env-reminder@latest
...
```

## Contributing

We welcome contributions. See [how to contribute](CONTRIBUTING.md).

