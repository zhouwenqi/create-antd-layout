#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./init");
const program = new commander_1.Command();
program
    .name('create-antd-layout')
    .description("Create a new antd-layout project from local or remote templates")
    .version("1.0.0")
    .argument("<project-directory>", 'Project directory name')
    .action(async (projectDir) => {
    (0, init_1.initProject)(projectDir);
});
program.parse();
