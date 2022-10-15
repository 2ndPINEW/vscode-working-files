import * as cp from "child_process";

export async function getWorkspaceChangingFiles (workspacePath: string | undefined): Promise<string[]> {
  if (!workspacePath) {
    return [];
  }
  try {
    const workspaceDefaultBranch = await getWorkspaceDefaultBranch(workspacePath);
    const workspacePastChangedFilesResult = (await execShell(`cd ${workspacePath} && git -c core.quotepath=false diff \`git show-branch --merge-base ${workspaceDefaultBranch} HEAD\` HEAD --name-only`));
    const workspacePastChangedFiles = workspacePastChangedFilesResult.split('\n');
    const workspaceChangingFilesResult = await execShell(`cd ${workspacePath} && git status -uall --porcelain | awk '{print $NF}'`);
    const workspaceChangingFiles = workspaceChangingFilesResult.split('\n');

    return [
      ...workspacePastChangedFiles,
      ...workspaceChangingFiles
    ].filter(fileName => !!fileName);
  } catch (e) {
    return [];
  }
}

async function getWorkspaceDefaultBranch (workspacePath: string | undefined): Promise<string | undefined> {
  try {
    const defaultBranch = await execShell(`cd ${workspacePath} && git remote show origin | grep 'HEAD branch' | awk '{print $NF}'`);
    return defaultBranch.split('\n')[0];
  } catch {
    return undefined;
  }
}

function execShell (cmd: string) {
  return new Promise<string>((resolve, reject) => {
    cp.exec(cmd, (err, out) => {
      if (err) {
        return reject(err);
      }
      return resolve(out);
    });
  });
};