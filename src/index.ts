#!/usr/bin/env node
import { Command } from "commander";
import { initProject } from "./init";

const program = new Command();

program
  .name('create-antd-layout')
  .description("Create a new antd-layout project from local or remote templates")
  .version("1.0.0")
  .argument("<project-directory>", 'Project directory name')
  .action(async (projectDir: string) => {    
    initProject(projectDir)
  });

program.parse();