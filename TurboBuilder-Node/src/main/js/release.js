'use strict';

/**
 * this module contains all the code related to the release process
 */


const { StringUtils } = require('turbocommons-ts');
const { FilesManager } = require('turbocommons-ts');
const { execSync } = require('child_process');
const console = require('./console');
const validateModule = require('./validate');
const buildModule = require('./build');
const UglifyJS = require("uglify-es");


let fm = new FilesManager(require('fs'), require('os'), require('path'), process);
let releasePath = global.runtimePaths.target + fm.dirSep() + global.runtimePaths.projectName + "-" + buildModule.getCurrentVersion();    


//We will delete the unpacked src files when application exits, may it be due to a 
//success or an error
process.on('exit', () => {
 
    if(!global.setupBuild.keepUnpackedSrcFiles){
        
        buildModule.removeUnpackedSrcFiles(releasePath);
    }
});


/**
 * Minifies all the js files that exist on the provided path
 */
let minifyJs = function (destPath) {
    
    let sep = fm.dirSep();
    let destDist = destPath + sep + 'dist';
    
    let jsFiles = fm.findDirectoryItems(destDist, /.*\.js$/i, 'absolute', 'files');
    
    for (let jsFile of jsFiles) {
        
        let jsCode = fm.readFile(jsFile);
        
        let result = UglifyJS.minify(jsCode);
        
        if(result.error !== undefined){
            
            console.error('Minification failed: ' + jsFile + "\n\n" + result.error);
        }
        
        fm.deleteFile(jsFile);        
        fm.createFile(jsFile, result.code); 
    }
    
    console.success("minify Js ok");
}


/**
 * Generates the code documentation for the configured languages
 */
let generateCodeDocumentation = function (destPath) {

    let sep = fm.dirSep();
    let destMain = destPath + sep + 'main';
    let docsPath = destPath + sep + 'docs';
    
    // Generate ts doc if ts build is enabled
    if(global.setupBuild.Ts.enabled){
        
        if(!fm.createDirectory(docsPath + sep + 'ts', true)){
           
            console.error('Could not create docs folder ' + docsPath + sep + 'ts');
        }
        
        let typeDocExec = global.installationPaths.typeDocBin;
        
        typeDocExec += ' --name ' + global.runtimePaths.projectName;
        typeDocExec += ' --module commonjs';
        typeDocExec += ' --mode modules';
        typeDocExec += ' --target ES5'; 
        typeDocExec += ' --options "' + destMain + sep + 'ts' + sep + 'tsconfig.json"';
        typeDocExec += ' --out "' + docsPath + sep + 'ts"';
        typeDocExec += ' "' + destMain + sep + 'ts"';
        
        console.exec(typeDocExec, 'ts doc ok');
    }
}


/**
 * Generates the code documentation for the configured languages
 */
let createGitChangeLog = function (destPath) {
    
    // Test that git is available on OS shell
    if(global.setupBuild.Ts.enabled){
        
        try{
            
            execSync('git --version', {stdio : 'pipe'});
            
        }catch(e){

            console.error('Could not find Git cmd executable. Please install git on your system to create git changelogs');
        }
    }
    
    // Define the changelog text
    let changeLogContents = global.runtimePaths.projectName + '-' + buildModule.getCurrentVersion() + ' CHANGELOG ---------------------------------------------';
    
    // Get the GIT tags sorted by date ascending
    let gitTagsList = execSync('git tag --sort version:refname', {stdio : 'pipe'}).toString();
    
    // Split the tags and generate the respective output for the latest global.setupRelease.gitChangeLogCount num of versions
    gitTagsList = gitTagsList.split("\n").reverse();
    
    let tags = [];
    
    for(let i=0; i < gitTagsList.length; i++){
        
        if(!StringUtils.isEmpty(gitTagsList[i])){
            
            tags.push(gitTagsList[i].replace(/\r?\n|\r/g, ""));
        }
    }
        
    changeLogContents += "\n\n";
        
    // Log the changes from the newest defined tag to the current repo state
    changeLogContents += execSync("git log " + tags[0] + '..HEAD --oneline --pretty=format:"%ad: %s%n%b" --date=short', {stdio : 'pipe'}).toString(); 
              
    // Log all the changes for each one of the defined tags
    
    for(let i=0; i < Math.min(global.setupRelease.gitChangeLogCount, tags.length); i++){
    
        changeLogContents += "\n\n\nVERSION: " + tags[i] + " ---------------------------------------------\n\n";
        
        let gitExecutionCommand = 'git '; 
    
        if(i >= (tags.length - 1)){
    
            gitExecutionCommand += "log " + tags[i] + ' --oneline --pretty=format:"%ad: %s%n%b" --date=short';
    
        }else{
    
            gitExecutionCommand += "log " + tags[i+1] + ".." + tags[i] + ' --oneline --pretty=format:"%ad: %s%n%b" --date=short';
        }
        
        changeLogContents += execSync(gitExecutionCommand, {stdio : 'pipe'}).toString();
    }
    
    // Create the changelog file
    fm.createFile(destPath + fm.dirSep() + 'Changelog.txt', changeLogContents);
    
    console.success("changelog ok");
}


/**
 * Execute the release process
 */
exports.execute = function () {
    
    console.log("\nrelease start");
    
    // TODO
    // Read the build number from file, increase it and save it.
    // We will increase it even if the build fails, to prevent overlapping files from different builds.
    // (Note that this file will be auto generated if it does not exist)
    
    buildModule.copyMainFiles(releasePath);
    
    if(global.setupValidate.runBeforeBuild){
        
        validateModule.execute();
    }
    
    if(global.setupBuild.Ts.enabled){
    
        buildModule.buildTypeScript(releasePath);
    }
    
    if(global.setupRelease.optimizeJs){
        
        minifyJs(releasePath);
    }
    
    if(global.setupRelease.generateCodeDocumentation){
        
        generateCodeDocumentation(releasePath);
    }
    
    if(global.setupRelease.gitChangeLog){
        
        createGitChangeLog(releasePath);
    }
    
    console.success('release ok');
};