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

    const repoToken = core.getInput('repo-token', {required: true});
    const client: github.GitHub = new github.GitHub(repoToken);
    const prNumber = context.payload.pull_request!.number

    const merged = await isMerged(client, prNumber);
    if (!merged) {
      console.log('No pull request was merged, exiting');
      return;
    } 

    const labels = [core.getInput('merge-label')];
    await addLabels(client, prNumber, labels);

    const message = core.getInput('merge-message');
    await addComment(client, prNumber, message);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function isMerged(
  client: github.GitHub,
  prNumber: number
): Promise<boolean> {
  const response = await client.pulls.checkIfMerged({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });
  return response.status == 204;
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
