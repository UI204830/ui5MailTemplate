#!/usr/bin/env node

const copyResources = require("./copy-sources");

const argv = require("yargs").argv;

copyResources
    .do('./dist', '../../dev/sap/750/ws.jdi/0/DCs/rwe.com/meldeapp/ui5web/_comp/WebContent')
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error(err);

        process.exit(1);
    });
