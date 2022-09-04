import {execaCommand} from "execa"
import inquirer from "inquirer"

import {postBuild} from "./post-build"

enum Choices {
  Yes = "Yes",
  No = "No",
}

async function promptForChoice(message: string): Promise<string> {
  return inquirer
    .prompt<{command: string}>([
      {
        choices: [Choices.Yes, Choices.No],
        message,
        name: "command",
        type: "list",
      },
    ])
    .then(async (answers) => {
      const {command} = answers
      return command
    })
}

async function deploy(): Promise<void> {
  const updateVersion = await promptForChoice("Update version?")
  if (updateVersion === Choices.Yes) {
    await execaCommand("lerna version", {stdio: "inherit"})
  }

  await execaCommand("yarn build", {stdio: "inherit"})

  const success = await postBuild()

  if (success) {
    await execaCommand("npm publish", {stdio: "inherit"})
  }
}

deploy()
