## Development

Thank you for your interest in this project. Please read the documentation here to begin contributing. 

### Creating an Action

- :file_folder: In a new branch create an new folder in a root folder of this repository and name it to your Action name.
- :octocat: Follow the instructions [Creating an Action with the Toolkit](https://github.com/actions/toolkit#creating-an-action-with-the-toolkit) to create an Action.
- :construction: Start developing and open a pull request.

Read more about GitHub Actions [here](https://help.github.com/en/articles/getting-started-with-github-actions).

### How to release new versions

Since we keep multiple Actions in one repository, all the Actions are released in one batch (we do not support semantic versioning yet). 

**JavaScript / TypeScript Action**

When your pull request was merged:

- create a new branch from `master` branch
- comment out `node_modules` in `.gitignore`

```
# comment out in distribution branches
# node_modules/
```
- add **only** your production dependencies:

```bash
$ npm prune --production
$ git add node_modules
$ git commit -a -m "Add production dependencies"
$ git push
```

- open a pull request with a destination branch to `latest` branch
- everything is ready to be :ship:

**Docker Action**

When your pull request was merged:

- create a new branch from `master` branch
- open a pull request with a destination branch to `latest` branch
- everything is ready to be :ship:
