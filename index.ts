const core = require('@actions/core');
const github = require('@actions/github');
const matchAll = require("match-all");
const Octokit = require("@octokit/rest");

async function extractJiraKeysFromCommit() {
    try {
        const regex = /([A-Z]+-\d+)/g;
        const isPullRequest = core.getInput('is-pull-request') == 'true';
        // console.log("isPullRequest: " + isPullRequest);
        const commitMessage = core.getInput('commit-message');
        // console.log("commitMessage: " + commitMessage);
        // console.log("core.getInput('parse-all-commits'): " + core.getInput('parse-all-commits'));
        const parseAllCommits = core.getInput('parse-all-commits') == 'true';
        // console.log("parseAllCommits: " + parseAllCommits);
        const payload = github.context.payload;

        const token = process.env['GITHUB_TOKEN'];
        const octokit = new Octokit({
            auth: token,
        });

        console.log("The commit message is " + commitMessage)

        if(isPullRequest) {
            let resultArr: any = [];

            console.log("is pull request...");

            const owner = payload.repository.owner.login;
            const repo = payload.repository.name;
            const prNum = payload.number;

            const { data } = await octokit.pulls.listCommits({
                owner: owner,
                repo: repo,
                pull_number: prNum
            });

            console.log("data for each length " + data.length); 
            data.forEach((item: any) => {
                const commit = item.commit;
                console.log("Found this commit" + commit.message); 
                const matches: any = matchAll(commit.message, regex).toArray();
                matches.forEach((match: any) => {
                    if(resultArr.find((element:any) => element == match)) {
                        console.log(match + " is already included in result array");
                    } else {
                        console.log(" adding " + match + " to result array");
                        console.log(" setting latest tp " + match);
                        resultArr.push(match);
                    }
                });

            });

            const result = resultArr.join(',');
            core.setOutput("jira-keys", result);
            core.setOutput("latest-jira-commit", result[result.length-1]); 
        }
        else {
            console.log("not a pull request");
                const payload = github.context.payload;

                if(parseAllCommits) {
                    console.log("parse-all-commits input val is true");
                    let resultArr: any = [];
                    console.log("payload for commits length " + payload.commits.length); 
                    payload.commits.forEach((commit: any) => {
                        console.log("found this second commit" + commit.message); 
                        const matches = matchAll(commit.message, regex).toArray();
                        matches.forEach((match: any) => {
                            if(resultArr.find((element: any) => element == match)) {
                                console.log(match + " is already included in result array");
                            } else {
                                console.log(" adding " + match + " to result array");
                                resultArr.push(match);
                            }
                        });

                    });

                    const result = resultArr.join(',');
                    core.setOutput("jira-keys", result);
                    core.setOutput("latest-jira-commit", result[result.length-1]); 
                }
                else {
                    console.log("parse-all-commits input val is false");
                    console.log("head_commit: ", payload.head_commit);
                    const matches = matchAll(payload.head_commit.message, regex).toArray();
                    const result = matches.join(',');
                    core.setOutput("jira-keys", result);
                    core.setOutput("latest-jira-commit", matches[matches.length - 1]); 
                }
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

(async function () {
    await extractJiraKeysFromCommit();
    // console.log("finished extracting jira keys from commit message");
})();

export default extractJiraKeysFromCommit
