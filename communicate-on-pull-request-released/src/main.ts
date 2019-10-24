import * as core from '@actions/core';
import * as github from '@actions/github';
import * as pullRequestParser from './pull-request-parser';
import * as releaseParser from './release-parser';

interface Release {
  tag: string;
  body: string;
  htmlURL: string;
}

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

    const release = extractReleaseFromPayload();
    if (typeof release === 'undefined') {
      console.log('No release metadata found, exiting');
      return;
    }

    const repoToken = core.getInput('repo-token', {required: true});
    const client: github.GitHub = new github.GitHub(repoToken);

    const prNumbers = releaseParser.getReferencedPullRequests(release.body);
    for (let prNumber of prNumbers) {
      await addCommentToPullRequest(
        client,
        prNumber,
        `Congratulations! :tada: This was released as part of [_fastlane_ ${release.tag}](${release.htmlURL}) :rocket:`
      );
      const labelToRemove = core.getInput('pr-label-to-remove');
      const canRemoveLabel = await canRemoveLabelFromIssue(
        client,
        prNumber,
        labelToRemove
      );
      if (canRemoveLabel) {
        await removeLabel(client, prNumber, labelToRemove);
      }
      await addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
      await addCommentToReferencedIssue(client, prNumber, release);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function addCommentToPullRequest(
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

async function addCommentToReferencedIssue(
  client: github.GitHub,
  prNumber: number,
  release: Release
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
      const message = [
        `The pull request #${prNumber} that closed this issue was merged and released as part of [_fastlane_ ${release.tag}](${release.htmlURL}) :rocket:`,
        `Please let us know if the functionality works as expected as a reply here. If it does not, please open a new issue. Thanks!`
      ];
      await addIssueComment(client, issueNumber, message.join('\n'));
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

async function canRemoveLabelFromIssue(
  client: github.GitHub,
  prNumber: number,
  label: string
): Promise<boolean> {
  const response = await client.issues.listLabelsOnIssue({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber
  });

  const issueLabels = response.data;
  for (let issueLabel of issueLabels) {
    if (issueLabel.name === label) {
      return true;
    }
  }
  return false;
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

function extractReleaseFromPayload(): Release | undefined {
  const release = github.context.payload['release'];
  if (release == null) {
    return undefined;
  }

  const tag = release['tag_name'];
  const body = release['body'];
  const htmlURL = release['html_url'];
  if (tag == null || body == null || htmlURL == null) {
    return undefined;
  }

  return {tag: tag, body: body, htmlURL: htmlURL};
}

run();
