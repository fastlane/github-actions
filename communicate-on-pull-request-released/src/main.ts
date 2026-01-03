import * as core from '@actions/core';
import * as github from '@actions/github';
import * as pullRequestParser from './pull-request-parser.js';
import * as releaseParser from './release-parser.js';
import fetch from 'node-fetch';

type Octokit = ReturnType<typeof github.getOctokit>;

interface Release {
  tag: string;
  body: string;
  htmlURL: string;
}

export async function run() {
  try {
    const repoToken = core.getInput('repo-token', {required: true});
    const versionInput = core.getInput('version', {required: false});
    const client = github.getOctokit(repoToken, {request: {fetch}});

    let release: Release | undefined;
    if (versionInput) {
      console.log(`Resolving release for version '${versionInput}'`);
      release = await resolveReleaseByVersion(client, versionInput);
    }

    // Fallback to release payload when available (e.g., on release: published)
    if (!release && github.context.eventName === 'release' && github.context.payload.action === 'published') {
      release = extractReleaseFromPayload();
    }

    if (!release) {
      core.setFailed(
        `No release found matching name '${versionInput} Improvements' and no usable payload available, exiting`
      );
      return;
    }

    const prNumbers = releaseParser.getReferencedPullRequests(release.body);
    for (const prNumber of prNumbers) {
      await addCommentToPullRequest(
        client,
        prNumber,
        `Congratulations! :tada: This was released as part of [_fastlane_ ${release.tag}](${release.htmlURL}) :rocket:`
      );
      const labelToRemove = core.getInput('pr-label-to-remove');
      const canRemoveLabel = await canRemoveLabelFromIssue(client, prNumber, labelToRemove);
      if (canRemoveLabel) {
        await removeLabel(client, prNumber, labelToRemove);
      }
      await addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
      await addCommentToReferencedIssue(client, prNumber, release);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}

async function addCommentToPullRequest(client: Octokit, prNumber: number, comment: string) {
  await client.rest.pulls.createReview({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
    body: comment,
    event: 'COMMENT'
  });
}

async function addCommentToReferencedIssue(client: Octokit, prNumber: number, release: Release) {
  const pullRequest = await getPullRequest(client, prNumber);
  if (pullRequest.body) {
    const issueNumber = pullRequestParser.getReferencedIssue(
      github.context.repo.owner,
      github.context.repo.repo,
      pullRequest.body
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

async function getPullRequest(client: Octokit, prNumber: number) {
  const response = await client.rest.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });
  return response.data;
}

async function canRemoveLabelFromIssue(client: Octokit, prNumber: number, label: string): Promise<boolean> {
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

async function addLabels(client: Octokit, prNumber: number, labels: string[]) {
  await client.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels
  });
}

async function removeLabel(client: Octokit, prNumber: number, label: string) {
  await client.rest.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    name: label
  });
}

async function addIssueComment(client: Octokit, issueNumber: number, message: string) {
  await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    body: message
  });
}

function extractReleaseFromPayload(): Release | undefined {
  const release = github.context.payload['release'];
  if (!release) {
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

async function resolveReleaseByVersion(client: Octokit, version: string): Promise<Release | undefined> {
  try {
    const response = await client.rest.repos.listReleases({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      per_page: 100
    });

    const expectedName = `${version} Improvements`;

    const match = response.data.find(r => {
      const name = r && (r.name || r.tag_name || '');
      return name === expectedName;
    });

    if (!match) {
      return undefined;
    }

    const body = match.body;
    const htmlURL = match.html_url;
    const tag = match.tag_name || match.name || version;
    if (body == null || htmlURL == null) {
      return undefined;
    }

    return {tag, body, htmlURL};
  } catch (e) {
    console.log(`Failed to resolve release by version '${version}': ${e instanceof Error ? e.message : e}`);
    return undefined;
  }
}

run();
