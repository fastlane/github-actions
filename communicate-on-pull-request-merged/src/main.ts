import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
  try {
    const isPullRequest: boolean = !!github.context.payload.pull_request;
    if (!isPullRequest) {
      console.log(
        'The event that triggered this action was not a pull request, exiting'
      );
      return;
    }

    if (github.context.payload.action !== 'closed') {
      console.log('No pull request was closed, exiting');
      return;
    }

    const repoToken = core.getInput('repo-token', {required: true});
    const client: github.GitHub = new github.GitHub(repoToken);
    const prNumber = github.context.payload.pull_request!.number;

    const merged = github.context.payload.pull_request!['merged'];
    if (!merged) {
      console.log('No pull request was merged, exiting');
      return;
    }

    await addLabels(client, prNumber, [core.getInput('pr-label')]);
    await addComment(
      client,
      prNumber,
      core.getInput('pr-comment', {required: true})
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function addComment(
  client: github.GitHub,
  prNumber: number,
  comment: string
) {
  await client.pulls.createReview({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
    body: comment,
    event: 'COMMENT'
  });
}

async function addLabels(
  client: github.GitHub,
  prNumber: number,
  labels: string[]
) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels
  });
}

run();
