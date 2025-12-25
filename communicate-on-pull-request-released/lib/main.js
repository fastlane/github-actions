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
            const versionInput = core.getInput('version', { required: false });
            const repoToken = core.getInput('repo-token', { required: true });
            const client = new github.GitHub(repoToken);
            let release;
            if (versionInput) {
                console.log(`Resolving release for version '${versionInput}'`);
                release = yield resolveReleaseByVersion(client, versionInput);
            }
            // Fallback to release payload when available (e.g., on release: published)
            if (!release && github.context.eventName === 'release' && github.context.payload.action === 'published') {
                release = extractReleaseFromPayload();
            }
            if (!release) {
                core.setFailed(`No release found matching name '${versionInput} Improvements' and no usable payload available, exiting`);
                return 1;
            }
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
        const issueNumber = pullRequestParser.getReferencedIssue(github.context.repo.owner, github.context.repo.repo, pullRequest.body);
        if (issueNumber) {
            const message = [
                `The pull request #${prNumber} that closed this issue was merged and released as part of [_fastlane_ ${release.tag}](${release.htmlURL}) :rocket:`,
                `Please let us know if the functionality works as expected as a reply here. If it does not, please open a new issue. Thanks!`
            ];
            yield addIssueComment(client, issueNumber, message.join('\n'));
        }
    });
}
function getPullRequest(client, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.pulls.get({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber
        });
        return response.data;
    });
}
function canRemoveLabelFromIssue(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.issues.listLabelsOnIssue({
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
    if (release === 'undefined') {
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
function resolveReleaseByVersion(client, version) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield client.repos.listReleases({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                per_page: 100
            });
            const expectedName = `${version} Improvements`;
            const match = (response.data).find(r => {
                const name = (r && (r.name || r.tag_name || ''));
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
            return { tag, body, htmlURL };
        }
        catch (e) {
            console.log(`Failed to resolve release by version '${version}': ${e.message || e}`);
            return undefined;
        }
    });
}
run();
