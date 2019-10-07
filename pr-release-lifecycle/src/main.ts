import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
  try {
    const context = github.context;

    const isPullRequest: boolean = !!context.payload.pull_request
    if (!isPullRequest) {
      console.log('The event that triggered this action was not a pull request, exiting');
      return;
    }

    if (context.payload.action !== 'closed') {
      console.log('No pull request was closed, exiting');
      return;
    }

    const pull_request = context.payload.pull_request!
    const repoToken = core.getInput('repo-token', {required: true});
    const client: github.GitHub = new github.GitHub(repoToken)
    const repo: {owner: string, repo: string} = context.repo;
    const response = await client.pulls.checkIfMerged({
      owner: repo.owner,
      repo: repo.repo,
      pull_number: pull_request.number
    });
    
    if (response.status != 204) {
      console.log('No pull request was merged, exiting');
      return;
    } 

    const message = core.getInput('merge-message');
    await client.pulls.createReview({
      owner: repo.owner,
      repo: repo.repo,
      pull_number: pull_request.number,
      body: message,
      event: 'COMMENT'
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
