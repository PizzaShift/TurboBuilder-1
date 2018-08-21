'use strict';

/**
 * this module contains all the code related to the generate process
 */


const { FilesManager, StringUtils, ObjectUtils } = require('turbocommons-ts');
const console = require('./console');
const validateModule = require('./validate');
const setupModule = require('./setup');


let fm = new FilesManager(require('fs'), require('os'), require('path'), process);


/**
 * Execute the generate process
 */
exports.execute = function (type) {

    validate(type);
    
    console.log("\ngenerate " + type + " start");
    
    createProjectStructure(type);
   
    // Generate a custom project setup and save it to file
    if(!fm.saveFile(global.runtimePaths.setupFile,
            JSON.stringify(setupModule.customizeSetupTemplateToProjectType(type), null, 4))){
        
        console.error('Error creating ' + global.fileNames.setup + ' file');
    }
    
    console.success('Created ' + global.fileNames.setup + ' file');
    
    console.success('Generated project structure ok');
};


/**
 * Check if project structure can be created
 */
let validate = function (type) {

    if(global.setupBuildTypes.indexOf(type) < 0){
        
        console.error("invalid project type");
    }
    
    let templateSetupPath = global.installationPaths.mainResources + fm.dirSep() + 'project-templates' + fm.dirSep() + 'shared' + fm.dirSep() + global.fileNames.setup;
    
    if (fm.isFile(global.runtimePaths.setupFile)) {
        
        console.error('File ' + global.fileNames.setup + ' already exists');
    }
    
    if (!fm.isFile(templateSetupPath)) {
        
        console.error(templateSetupPath + ' file not found');
    }
    
    if(!fm.isDirectoryEmpty(global.runtimePaths.root)){
        
        console.error('Current folder is not empty! :' + global.runtimePaths.root);
    }
}


/**
 * Generate the project folders and files on the current runtime directory
 */
let createProjectStructure = function (type) {
    
    let sep = fm.dirSep();
    let templatesFolder = global.installationPaths.mainResources + sep + 'project-templates';
    
    // Copy the project type specific files
    fm.copyDirectory(templatesFolder + sep + type, global.runtimePaths.root);
    
    // Copy the extras folder
    fm.createDirectory(global.runtimePaths.extras);
    
    if(!fm.copyDirectory(templatesFolder + sep + 'shared' + sep + 'extras', global.runtimePaths.extras, false)){
    
        console.error('Failed creating: ' + global.runtimePaths.extras);
    }
    
    // Create readme file
    if(!fm.copyFile(templatesFolder + sep + 'shared' + sep + global.fileNames.readme,
       global.runtimePaths.root + sep + global.fileNames.readme)){
        
        console.error('Failed creating: ' + global.runtimePaths.root + sep + global.fileNames.readme);
    }
    
    // Copy the gitignore file
    if(!fm.copyFile(templatesFolder + sep + 'shared' + sep + 'gitignore.txt',
        global.runtimePaths.root + sep + global.fileNames.gitignore)){
         
        console.error('Failed creating: ' + global.runtimePaths.root + sep + global.fileNames.gitignore);
    }
    
    replaceDependenciesIntoTemplate();
    
    console.success('Generated ' + type + ' structure');
}


/**
 * Replaces all the template dummy files (called *.tbdependency) with the real library ones.
 * Doing it this way we keep all the big files on a single location
 */
let replaceDependenciesIntoTemplate = function () {
    
    let sep = fm.dirSep();
    let libsPath = global.installationPaths.mainResources + sep + 'libs';

    let tbdependencies = fm.findDirectoryItems(global.runtimePaths.root, /^.*\.tbdependency$/, 'absolute');
    
    for(let tbdependency of tbdependencies){
        
        let depFile = StringUtils.getPathElement(tbdependency);
        let depParent = StringUtils.replace(tbdependency, StringUtils.getPathElement(tbdependency), '');
        
        
        if(depFile === 'normalize.tbdependency'){
            
            fm.copyFile(libsPath + sep + 'normalize.css', depParent + sep + 'normalize.css');
        }
        
        if(depFile === 'jquery.tbdependency'){
            
            fm.copyFile(libsPath + sep + 'jquery.js', depParent + sep + 'jquery.js');
        }
        
        if(depFile === 'phpunit.tbdependency'){
            
            fm.copyFile(libsPath + sep + 'phpunit-6.2.3.phar', depParent + sep + 'phpunit-6.2.3.phar');
        }
        
        if(depFile === 'turbocommons-es5.tbdependency'){
            
            fm.copyFile(libsPath + sep + 'turbocommons-es5.js', depParent + sep + 'turbocommons-es5.js');
        }
        
        if(depFile === 'turbocommons-php.tbdependency'){
            
            fm.copyFile(libsPath + sep + 'TurboCommons-Php-0.7.2.phar', depParent + sep + 'TurboCommons-Php-0.7.2.phar');
        }
        
        if(depFile === 'turbosite.tbdependency'){
            
            fm.copyFile(libsPath + sep + 'TurboSite-Php-0.1.0.phar', depParent + sep + 'TurboSite-Php-0.1.0.phar');
        }

        fm.deleteFile(tbdependency);
    }
}