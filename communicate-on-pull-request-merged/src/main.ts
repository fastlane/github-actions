import * as core from '@actions/core';
import * as github from '@actions/github';
import fetch from 'node-fetch';

export async function run() {
  try {
    const context = github.context;
    const isPullRequest: boolean = !!context.payload.pull_request;
    if (!isPullRequest) {
      console.log('The event that triggered this action was not a pull request, exiting');
      return;
    }

    if (context.payload.action !== 'closed') {
      console.log('No pull request was closed, exiting');
      return;
    }

    const repoToken = core.getInput('repo-token', {required: true});
    const client = github.getOctokit(repoToken, {request: {fetch}});
    const prNumber = context.payload.pull_request!.number;

    const merged = context.payload.pull_request!['merged'];
    if (!merged) {
      console.log('No pull request was merged, exiting');
      return;
    }

    const labelToRemove = core.getInput('pr-label-to-remove');
    const canRemoveLabel = await canRemoveLabelFromIssue(client, prNumber, labelToRemove);
    if (canRemoveLabel) {
      await removeLabel(client, prNumber, labelToRemove);
    }

    await addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
    await addComment(client, prNumber, core.getInput('pr-comment', {required: true}));
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}

async function addComment(client: any, prNumber: number, comment: string): Promise<void> {
  await client.rest.pulls.createReview({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
    body: comment,
    event: 'COMMENT'
  });
}

async function addLabels(client: any, prNumber: number, labels: string[]): Promise<void> {
  await client.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels
  });
}

async function canRemoveLabelFromIssue(client: any, prNumber: number, label: string): Promise<boolean> {
  const response = await client.rest.issues.listLabelsOnIssue({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber
  });

  const issueLabels = response.data;
  for (const issueLabel of issueLabels) {
    if (issueLabel.name === label) {
      return true;
    }
  }
  return false;
}

async function removeLabel(client: any, prNumber: number, label: string): Promise<void> {
  await client.rest.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    name: label
  });
}
