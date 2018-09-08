'use strict';

/**
 * this module contains all the code related to the release process
 */


const { StringUtils } = require('turbocommons-ts');
const { FilesManager } = require('turbocommons-ts');
const { execSync } = require('child_process');
const console = require('./console');
const validateModule = require('./validate');
const setupModule = require('./setup');
const buildModule = require('./build');
const UglifyJS = require("uglify-es");
const CleanCSS = require('clean-css');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

let fm = new FilesManager(require('fs'), require('os'), require('path'), process);


let releaseRelativePath = '';


/**
 * We will delete the unpacked src files when application exits, may it be due to a
 * success or an error
 */
process.on('exit', () => {
 
    buildModule.removeUnpackedSrcFiles(global.runtimePaths.target + fm.dirSep() + this.getReleaseRelativePath());
});


/**
 * Execute the release process
 */
exports.execute = function () {
    
    console.log("\nrelease start");
    
    let releaseFullPath = global.runtimePaths.target + fm.dirSep() + this.getReleaseRelativePath();
    
    // Delete all files inside the release path folder
    fm.deleteDirectory(releaseFullPath);
    
    buildModule.copyMainFiles(releaseFullPath);
    
    if(global.setup.validate.runBeforeBuild){
        
        validateModule.execute(false);
    }
    
    if(global.setup.build.lib_php){
        
        buildModule.buildLibPhp(releaseFullPath);
    }
    
    if(global.setup.build.lib_ts){
    
        buildModule.buildLibTs(releaseFullPath);
    }
    
    if(global.setup.build.site_php){
        
        buildModule.buildSitePhp(releaseFullPath);
    }
    
    minifyJs(releaseFullPath);
    minifyCss(releaseFullPath);
    minifyHtaccess(releaseFullPath);
    minifyPhpFiles(releaseFullPath);
    
    if(global.setup.release.optimizePictures){
    
        minifyImages(releaseFullPath);
    }
    
    // After js files are minified, we will write the project version
    // inside the merged js files of the lib_ts projects
    if(global.setup.build.lib_ts){
        
        buildModule.markMergedJsWithVersion(releaseFullPath);
    }
    
    if(global.setup.release.generateCodeDocumentation){
        
        generateCodeDocumentation(releaseFullPath);
    }
    
    if(global.setup.release.gitChangeLog){
        
        createGitChangeLog(releaseFullPath);
    }
    
    console.success('release ok (' + this.getReleaseRelativePath() + ')');
};


/**
 * Gets the path relative to project target where current release version will be generated
 */
exports.getReleaseRelativePath = function () {
    
    if(releaseRelativePath === ''){
        
        releaseRelativePath = global.runtimePaths.projectName + "-" + setupModule.getProjectRepoSemVer(true);
    }

    return releaseRelativePath; 
}


/**
 * Minifies (overwrites) all the js files that exist on the provided path
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
        fm.saveFile(jsFile, result.code); 
    }
    
    if(jsFiles.length > 0){
        
        console.success("minify Js ok");
    }
}


/**
 * Minifies (overwrites) all the css files that exist on the provided path
 */
let minifyCss = function (destPath) {
    
    let sep = fm.dirSep();
    let destDist = destPath + sep + 'dist';
    
    let cssFiles = fm.findDirectoryItems(destDist, /.*\.css$/i, 'absolute', 'files');
    
    for (let cssFile of cssFiles) {
        
        let cssCode = fm.readFile(cssFile);
        
        var result = new CleanCSS({
            level: {
                1: {
                  specialComments: 0
                }
              }
            }).minify(cssCode);
        
        if(result.errors.length > 0){
            
            console.error('Minification failed: ' + cssFile + "\n\n" + result.error[0]);
        }
        
        fm.deleteFile(cssFile);
        fm.saveFile(cssFile, result.styles); 
    }
    
    if(cssFiles.length > 0){
        
        console.success("minify Css ok");
    }
}


/**
 * Minifies (overwrites) all the image files that exist on the provided path
 */
let minifyImages = function (destPath) {
    
    let sep = fm.dirSep();
    let destDist = destPath + sep + 'dist';
    
    let imageFiles = fm.findDirectoryItems(destDist, /^.*\.(jpg|jpeg|png)$/i, 'absolute', 'files');
    
    for (let imageFile of imageFiles) {
        
        // Asynchronously overwrite all the project images with their optimized versions
        imagemin([imageFile], StringUtils.getPath(imageFile), {
            plugins: [
                imageminJpegtran({
                    progressive: true
                }),
                imageminPngquant({
                    quality: '65-80',
                    speed: 1, // The lowest speed of optimization with the highest quality
                    floyd: 1 // Controls level of dithering (0 = none, 1 = full).
                })
            ]
        });
    }
    
    if(imageFiles.length > 0){
        
        console.success("minify Images ok");
    }    
}


/**
 * Minifies (overwrites) all the php files that exist on the provided path
 */
let minifyPhpFiles = function (destPath) {
    
    let sep = fm.dirSep();
    let destDist = destPath + sep + 'dist';
    
    let phpFiles = fm.findDirectoryItems(destDist, /.*\.php$/i, 'absolute', 'files');
    
    for (let phpFile of phpFiles) {
        
        let phpMinified = '';
        
        try{
            
            phpMinified = execSync('php -w "' + phpFile + '"', {stdio : 'pipe'}).toString();
            
        }catch(e){

            console.error("Php minify failed");
        }
        
        fm.deleteFile(phpFile);
        fm.saveFile(phpFile, phpMinified); 
    }
    
    if(phpFiles.length > 0){
        
        console.success("minify php ok");
    }
}


/**
 * Minifies (overwrites) all the .htaccess files that exist on the provided path
 */
let minifyHtaccess = function (destPath) {
    
    let sep = fm.dirSep();
    let destDist = destPath + sep + 'dist';
    
    let htaccessFiles = fm.findDirectoryItems(destDist, /.*\.htaccess$/i, 'absolute', 'files');
    
    for (let htaccessFile of htaccessFiles) {
        
        let htaccessMinified = [];
        let htaccessLines = StringUtils.getLines(fm.readFile(htaccessFile));
        
        for (let line of htaccessLines) {
            
            if(line.trim().indexOf('#') !== 0){
                
                htaccessMinified.push(line);
            }
        }
        
        fm.deleteFile(htaccessFile);
        fm.saveFile(htaccessFile, htaccessMinified.join("\n")); 
    }
    
    if(htaccessFiles.length > 0){
        
        console.success("minify .htaccess ok");
    }
}


/**
 * Generates the code documentation for the configured languages
 */
let generateCodeDocumentation = function (destPath) {

    let sep = fm.dirSep();
    let destMain = destPath + sep + 'main';
    let docsPath = destPath + sep + 'docs';
    
    // Generate php doc if php build is enabled
    if(global.setup.build.lib_php){
        
        if(!fm.createDirectory(docsPath + sep + 'php', true)){
            
            console.error('Could not create docs folder ' + docsPath + sep + 'php');
        }
        
        let phpDocExec = 'php';
        
        phpDocExec += ' "' + global.installationPaths.mainResources + sep + 'libs' + sep + 'phpDocumentor.phar"';
        phpDocExec += ' --template="responsive-twig"';
        phpDocExec += ' --visibility="public"';
        phpDocExec += ' --title="' + global.runtimePaths.projectName + "-" + setupModule.getProjectRepoSemVer() + '"';
        phpDocExec += ' -i "' + destMain + '/php/libs,autoloader.php"';
        phpDocExec += ' -d "' + destMain + sep + 'php"';
        phpDocExec += ' -t "' + docsPath + sep + 'php"';
        
        console.exec(phpDocExec, 'php doc ok');
    }
    
    // Generate ts doc if ts build is enabled
    if(global.setup.build.lib_ts){
        
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
    
    buildModule.checkGitAvailable();
    
    // Define the changelog text
    let changeLogContents = global.runtimePaths.projectName + ' DEV CHANGELOG ---------------------------------------------';
    
    // Get the GIT tags sorted by date ascending
    let gitTagsList = '';
    
    try{
    
        gitTagsList = execSync('git tag --sort version:refname', {stdio : 'pipe'}).toString();
        
    }catch(e){

        console.warning("changelog failed. Not a git repository?");
        
        return;
    }
    
    // Split the tags and generate the respective output for the latest global.setup.release.gitChangeLogCount num of versions
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
    
    for(let i=0; i < Math.min(global.setup.release.gitChangeLogCount, tags.length); i++){
    
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
    fm.saveFile(destPath + fm.dirSep() + 'Changelog.txt', changeLogContents);
    
    console.success("changelog ok");
}