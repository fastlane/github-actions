"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const pullRequestParser = __importStar(require("./pull-request-parser"));
const releaseParser = __importStar(require("./release-parser"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (github.context.eventName !== 'release') {
                console.log('The event that triggered this action was not a release, exiting');
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
            const repoToken = core.getInput('repo-token', { required: true });
            const client = new github.GitHub(repoToken);
            const prNumbers = releaseParser.getReferencedPullRequests(release.body);
            for (let prNumber of prNumbers) {
                yield addCommentToPullRequest(client, prNumber, `Congratulations! :tada: This was released as part of [_fastlane_ ${release.tag}](${release.htmlURL}) :rocket:`);
                const labelToRemove = core.getInput('pr-label-to-remove');
                const canRemoveLabel = yield canRemoveLabelFromIssue(client, prNumber, labelToRemove);
                if (canRemoveLabel) {
                    yield removeLabel(client, prNumber, labelToRemove);
                }
                yield addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
                yield addCommentToReferencedIssue(client, prNumber, release);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
function addCommentToPullRequest(client, prNumber, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.pulls.createReview({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber,
            body: comment,
            event: 'COMMENT'
        });
    });
}
function addCommentToReferencedIssue(client, prNumber, release) {
    return __awaiter(this, void 0, void 0, function* () {
        const pullRequest = yield getPullRequest(client, prNumber);
        const body = pullRequest['body'];
        if (body) {
            const issueNumber = pullRequestParser.getReferencedIssue(github.context.repo.owner, github.context.repo.repo, body);
            if (issueNumber) {
                const message = [
                    `The pull request #${prNumber} that closed this issue was merged and released as part of [_fastlane_ ${release.tag}](${release.htmlURL}) :rocket:`,
                    `Please let us know if the functionality works as expected as a reply here. If it does not, please open a new issue. Thanks!`
                ];
                yield addIssueComment(client, issueNumber, message.join('\n'));
            }
        }
    });
}
function getPullRequest(client, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.pulls.get({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber
        });
    });
}
function canRemoveLabelFromIssue(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        const issueLabels = yield client.issues.listLabelsOnIssue({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber
        });
        for (let issueLabel of issueLabels) {
            if (issueLabel.name === label) {
                return true;
            }
        }
        return false;
    });
}
function addLabels(client, prNumber, labels) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            labels: labels
        });
    });
}
function removeLabel(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.removeLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            name: label
        });
    });
}
function addIssueComment(client, issueNumber, message) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issueNumber,
            body: message
        });
    });
}
function extractReleaseFromPayload() {
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
    return { tag: tag, body: body, htmlURL: htmlURL };
}
run();
