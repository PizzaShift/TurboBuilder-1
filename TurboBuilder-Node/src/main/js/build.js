'use strict';

/**
 * this module contains all the code related to the build process
 */


const { FilesManager, StringUtils } = require('turbocommons-ts');
const console = require('./console');
const setupModule = require('./setup');
const validateModule = require('./validate');


let fm = new FilesManager(require('fs'), require('os'), require('path'), process);


/**
 * We will delete the unpacked src files when application exits, may it be due to a
 * success or an error
 */
process.on('exit', () => {

    if(global.setup !== null &&
            !global.setup.build.keepUnpackedSrcFiles){
        
        this.removeUnpackedSrcFiles(global.runtimePaths.target + fm.dirSep() + this.getBuildRelativePath());
    }
});


/**
 * Gets the path relative to project target where current build version is generated
 */
exports.getBuildRelativePath = function () {
    
    return global.runtimePaths.projectName;    
}


/**
 * Copy all the project src/main files to the target folder. Any unwanted files/folders are excluded
 */
exports.copyMainFiles = function (destPath) {
    
    // If source file is empty, alert the user
    if(fm.findDirectoryItems(global.runtimePaths.main, /.*/i, 'relative', 'files').length === 0){
        
        console.error('no files to build');
    }
    
    let destMain = destPath + fm.dirSep() + 'main';
    
    // Copy the main folder to the target
    fm.createDirectory(destMain, true);
    
    // Ignore all the following files: thumbs.db .svn .git
    // TODO let filesToCopy = fm.findDirectoryItems(global.runtimePaths.main, /^(?!.*(thumbs\.db|\.svn|\.git)$)/i, 'absolute', 'files');
    
    // TODO fm.copyFiles(filesToCopy, global.runtimePaths.targetProjectName + fm.dirSep() + 'main');
    
    fm.copyDirectory(global.runtimePaths.main, destMain);
    
    // TODO - Replace the string @@package-build-version@@ on all the files with the real build version number
    
    console.success('copy main files ok');
}


/**
 * Execute the php build process to the specified dest folder
 */
exports.buildPhp = function (destPath) {
    
    let sep = fm.dirSep();
    let destMain = destPath + sep + 'main';
    let destDist = destPath + sep + 'dist';
    
    setupModule.checkPhpAvailable();
    
    // Autoloader.php must exist on src/main/php/ for the phar to be correctly generated
    let autoLoaderPath = global.runtimePaths.main + sep + 'php' + sep + 'AutoLoader.php';
    
    if(!fm.isFile(autoLoaderPath)){
        
        console.error(autoLoaderPath + " not found.\nThis is required to create a phar that loads classes automatically");
    }
    
    // Define the contents for the stub file that will be autoexecuted when the phar file is included
    let pharName = global.runtimePaths.projectName + '.phar';
    
    let phpStubFile = "<?php Phar::mapPhar(); include \\'phar://" + pharName + "/php/AutoLoader.php\\'; __HALT_COMPILER(); ?>";
    
    // Create the dist folder if not exists
    if(!fm.isDirectory(destDist) && !fm.createDirectory(destDist)){
        
        console.error('Could not create ' + destDist);
    }
    
    // Create the phar using the current project name
    let phpExecCommand = 'php -d display_errors -r';
    
    phpExecCommand += '"';
    phpExecCommand += " $p = new Phar('" + destDist + sep + pharName + "', FilesystemIterator::CURRENT_AS_FILEINFO | FilesystemIterator::KEY_AS_FILENAME, '" + pharName + "');";
    phpExecCommand += " $p->startBuffering();";
    phpExecCommand += " $p->setStub('" + phpStubFile + "');";
    phpExecCommand += " $p->buildFromDirectory('" + destMain + "');";
    phpExecCommand += " $p->compressFiles(Phar::GZ); $p->stopBuffering();";
    phpExecCommand += '"';
    
    console.exec(phpExecCommand);
}


/**
 * Execute the typescript build process to the specified dest folder
 */
exports.buildTypeScript = function (destPath) {
    
    let sep = fm.dirSep();
    let destMain = destPath + sep + 'main';
    let destDist = destPath + sep + 'dist';
    let tsConfig = destMain + sep + 'ts' + sep + 'tsconfig.json';
    
    // Create a default tsconfig file if there's no specific one
    if (!fm.isFile(tsConfig) &&
        !fm.saveFile(tsConfig, '{"compilerOptions":{"target": "es5"}}')) {
        
        console.error('Could not create ' + tsConfig);
    }
    
    for (let target of global.setup.build.ts.targets) {
    
        let isMergedFile = target.hasOwnProperty('mergedFile') && !StringUtils.isEmpty(target.mergedFile);
        
        let compiledFolder = destDist + sep + target.folder + (isMergedFile ? sep + 'tmp' : '');

        let tsExecution = global.installationPaths.typeScriptBin;
        
        tsExecution += global.setup.build.ts.strict ? ' --strict' : '';
        tsExecution += global.setup.build.ts.declaration ? ' --declaration' : '';
        tsExecution += global.setup.build.ts.sourceMap ? ' --sourceMap' : '';

        tsExecution += ' --alwaysStrict';             
        tsExecution += ' --target ' + target.jsTarget;
        tsExecution += ' --outDir "' + compiledFolder + '"';
        tsExecution += ' --module commonjs';
        tsExecution += ' --rootDir "' + destMain + sep + 'ts"';      
        tsExecution += ' --project "' + destMain + sep + 'ts"';                          
        console.exec(tsExecution);

        // Check if the target requires a merged JS file or not
        if(isMergedFile){
            
            let mergedFileName = target.mergedFile + '.js';
            
            // Generate via webpack the merged JS file for the current target       
            let webPackExecution = global.installationPaths.webPackBin;
             
            webPackExecution += ' "' + compiledFolder + sep + 'index.js"';
            webPackExecution += ' "' + destDist + sep + target.folder + sep + mergedFileName + '"';
            webPackExecution += ' --output-library ' + target.globalVar;                            
            
            if(global.setup.build.ts.sourceMap){
                
                fm.saveFile(compiledFolder + sep + 'webpack.config.js', "module.exports = {devtool: 'source-map'};");
                
                webPackExecution += ' --config "' + compiledFolder + sep + 'webpack.config.js"';     
            }

            console.exec(webPackExecution, 'Webpack ' + target.target + ' ok');
            
            fm.deleteDirectory(compiledFolder);   
        }
    }
}


/**
 * Delete all the src main files that exist on target folder
 */
exports.removeUnpackedSrcFiles = function (destPath) {

    let destMain = destPath + fm.dirSep() + 'main';
    
    // Delete the files
    if(fm.isDirectory(destMain) && !fm.deleteDirectory(destMain)){
        
        console.error('Could not delete unpacked src files from ' + destMain);
    }
}


/**
 * Execute the build process
 */
exports.execute = function () {

    console.log("\nbuild start");
    
    // If no builder is enabled launch error
    if(!global.setup.build.php.enabled &&
       !global.setup.build.js.enabled &&
       !global.setup.build.java.enabled &&
       !global.setup.build.ts.enabled){
        
        console.error("Nothing to build. Please enable php, js, java or ts under build section in " + global.fileNames.setup);
    }
    
    
    let buildFullPath = global.runtimePaths.target + fm.dirSep() + this.getBuildRelativePath();
    
    // Delete all files inside the target/projectName folder
    fm.deleteDirectory(buildFullPath);
    
    // Copy all the src main files to the target dev build folder
    this.copyMainFiles(buildFullPath);
    
    if(global.setup.validate.runBeforeBuild){
        
        validateModule.execute(false);
    }
    
    if(global.setup.build.php.enabled){
        
        this.buildPhp(buildFullPath);
    }
    
    if(global.setup.build.ts.enabled){
    
        this.buildTypeScript(buildFullPath);
    }
    
    console.success('build ok');
};