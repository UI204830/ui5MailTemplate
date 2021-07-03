    const fsExtra = require('fs-extra');
const path = require('path');

module.exports.do = (from, to) => {
    const targetFolder = path.resolve(process.cwd(), to);

    // fsExtra.emptyDirSync(targetFolder);

    return fsExtra.copy(path.resolve(process.cwd(), from), targetFolder);
};
