import * as core from '@actions/core';
import * as github from '@actions/github';
import * as pullRequestParser from './pull-request-parser';

export async function run() {
  try {
    if (github.context.eventName !== 'release') {
      console.log(
        'The event that triggered this action was not a release, exiting'
      );
      return;
    }

    if (github.context.payload.action !== 'published') {
      console.log('No release was published, exiting');
      return;
    }

    const repoToken = core.getInput('repo-token', {required: true});
    const client: github.GitHub = new github.GitHub(repoToken);
    const prNumbers = []; // TODO: Support getting a pull request numbers

    for (let prNumber of prNumbers) {
      await addCommentToReferencedIssue(client, prNumber);
      await removeLabel(client, prNumber, core.getInput('pr-label-to-remove'));
      await addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function addCommentToReferencedIssue(
  client: github.GitHub,
  prNumber: number
) {
  const pullRequest = await getPullRequest(client, prNumber);
  const body = pullRequest['body'];
  if (body) {
    const issueNumber = pullRequestParser.getReferencedIssue(
      github.context.repo.owner,
      github.context.repo.repo,
      body
    );
    if (issueNumber) {
      // TODO: Post a correct message.
      await addIssueComment(client, issueNumber, 'TODO');
    }
  }
}

async function getPullRequest(client: github.GitHub, prNumber: number) {
  await client.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
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

async function removeLabel(
  client: github.GitHub,
  prNumber: number,
  label: string
) {
  await client.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    name: label
  });
}

async function addIssueComment(
  client: github.GitHub,
  issueNumber: number,
  message: string
) {
  await client.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    body: message
  });
}

run();
