'use strict';

/**
 * this module contains all the code related to the build process
 */


const { FilesManager } = require('turbocommons-ts');
const console = require('./console');
const validateModule = require('./validate');


let fm = new FilesManager(require('fs'), require('os'), require('path'), process);


/**
 * Generate the project folders and files on the current runtime directory
 */
exports.createProjectStructure = function () {
    
    // Create src folder
    if(!fm.createDirectory(global.runtimePaths.src)){
        
        console.error('Failed creating: ' + global.runtimePaths.src);
    }
    
    // Create main folder
    if(!fm.createDirectory(global.runtimePaths.main)){
    
        console.error('Failed creating: ' + global.runtimePaths.main);
    }
    
    // Create main resources folder
    if(!fm.createDirectory(global.runtimePaths.mainResources)){
        
        console.error('Failed creating: ' + global.runtimePaths.mainResources);
    }
    
    // Create test folder
    if(!fm.createDirectory(global.runtimePaths.test)){
        
        console.error('Failed creating: ' + global.runtimePaths.test);
    }
    
    // Create extras folder
    if(!fm.createDirectory(global.runtimePaths.extras)){
        
        console.error('Failed creating: ' + global.runtimePaths.extras);
    }
    
    console.success('Created all folders ok');
    
    // Create readme file
    if(!fm.copyFile(global.installationPaths.mainResources + fm.dirSep() + global.fileNames.readme,
                    global.runtimePaths.root + fm.dirSep() + global.fileNames.readme)){
        
        console.error('Failed creating: ' + global.runtimePaths.root + fm.dirSep() + global.fileNames.readme);
    }
    
    // Create todo file
    if(!fm.copyFile(global.installationPaths.mainResources + fm.dirSep() + global.fileNames.todo,
                    global.runtimePaths.extras + fm.dirSep() + global.fileNames.todo)){
        
        console.error('Failed creating: ' + global.runtimePaths.extras + fm.dirSep() + global.fileNames.todo);        
    }
    
    console.success('Created all files ok');
    
    console.success('Generated project structure ok');
}


/**
 * Checks that all the required cmd tools are available and can be executed
 */
let verifyToolsAvailable = function () {

	// TODO - check if this is necessary or not
}


/**
 * Copy all the project src/main files to the target folder. Any unwanted files/folders are excluded
 */
let copyMainFiles = function () {
    
    // Delete all files inside the target/projectName folder
    fm.deleteDirectory(global.runtimePaths.targetProjectName);
    
    // Copy the main folder to the target
    fm.createDirectory(global.runtimePaths.targetMain, true);
    
    // Ignore all the following files: thumbs.db .svn .git
    // TODO let filesToCopy = fm.findDirectoryItems(global.runtimePaths.main, /^(?!.*(thumbs\.db|\.svn|\.git)$)/i, 'absolute', 'files');
    
    // TODO fm.copyFiles(filesToCopy, global.runtimePaths.targetProjectName + fm.dirSep() + 'main');
    
    fm.copyDirectory(global.runtimePaths.main, global.runtimePaths.targetMain);
    
    // TODO - Replace the string @@package-build-version@@ on all the files with the real build version number
}


/**
 * Execute the typescript build process
 */
let buildTypeScript = function () {
    
    let sep = fm.dirSep();
    let tsConfig = global.runtimePaths.main + fm.dirSep() + 'ts' + fm.dirSep() + 'tsconfig.json';
    
    // Check that tsconfig file exists.
    if (!fm.isFile(tsConfig)) {
        
        console.error(tsConfig + ' file not found');
    }
    
    // Generate the Typescript compatible dist version
    let tsExecution = global.installationPaths.typeScriptBin;
        
    tsExecution += global.setupBuild.Ts.compilerStrict ? ' --strict' : '';
    tsExecution += global.setupBuild.Ts.compilerDeclarationFile ? ' --declaration' : '';
    tsExecution += global.setupBuild.Ts.compilerSourceMap ? ' --sourceMap' : '';
    
    tsExecution += ' --alwaysStrict';             
    tsExecution += ' --target ES6';
    tsExecution += ' --outDir "' + global.runtimePaths.targetDist + fm.dirSep() + 'TS"';
    tsExecution += ' --module commonjs';
    tsExecution += ' --rootDir "' + global.runtimePaths.targetMain + fm.dirSep() + 'ts"';      
    tsExecution += ' --project "' + global.runtimePaths.targetMain + fm.dirSep() + 'ts"';     
    
    console.exec(tsExecution);
    
    // Generate the javascript single file versions
    tsExecution = global.installationPaths.typeScriptBin;
    let targets = global.setupBuild.Ts.CompilerTarget;
    
    for(var i=0; i < targets.length; i++){
        
        let tmpFolder = global.runtimePaths.targetDist + sep + targets[i].target + sep + 'tmp';
        let mergedFileName = (targets[i].mergedFileName == '' ? global.runtimePaths.projectName : targets[i].mergedFileName) + '.js';
        
        // Compile the typescript project with the current JS target into a temp folder
        tsExecution += global.setupBuild.Ts.compilerStrict ? ' --strict' : '';
        tsExecution += global.setupBuild.Ts.compilerDeclarationFile ? ' --declaration' : '';
        tsExecution += global.setupBuild.Ts.compilerSourceMap ? ' --sourceMap' : '';

        tsExecution += ' --alwaysStrict';             
        tsExecution += ' --target ' + targets[i].target;
        tsExecution += ' --outDir "' + tmpFolder + '"';
        tsExecution += ' --module commonjs';
        tsExecution += ' --rootDir "' + global.runtimePaths.targetMain + sep + 'ts"';      
        tsExecution += ' --project "' + global.runtimePaths.targetMain + sep + 'ts"';                          
        console.exec(tsExecution);

        // Generate via webpack the merged JS file for the current target       
        let webPackExecution = global.installationPaths.webPackBin;
        
        webPackExecution += ' "' + tmpFolder + sep + 'index.js"';
        webPackExecution += ' "' + global.runtimePaths.targetDist + sep + targets[i].target + sep + mergedFileName + '"';
        webPackExecution += ' --output-library ' + targets[i].globalVar;                            
        
        if(global.setupBuild.Ts.compilerSourceMap){
            
            fm.createFile();
            
            createFile(global.runtimePaths.targetDist + sep + targets[i].target + '/tmp/webpack.config.js', "module.exports = {devtool: 'source-map'};");
            webPackExecution += ' --config "' + global.runtimePaths.targetDist + sep + targets[i].target + '/tmp/webpack.config.js"';     
        }

        console.exec(webPackExecution, 'Webpack ' + targets[i].target + ' ok');

        // Delete temp folder
        fm.deleteDirectory(tmpFolder);
    }
}


/**
 * Execute the build process
 */
exports.execute = function () {

    verifyToolsAvailable();
    
    // TODO
    // Read the build number from file, increase it and save it.
    // We will increase it even if the build fails, to prevent overlapping files from different builds.
    // (Note that this file will be auto generated if it does not exist)
    
    copyMainFiles();
    
    if(global.setupValidate.runBeforeBuild){
        
        validateModule.execute();
    }
    
    if(global.setupBuild.Ts.enabled){
    
        buildTypeScript();
    }
    
    console.success('build ok');
};