'use strict';

/**
 * this module contains all the code related to the project validation
 */


const { StringUtils, ObjectUtils, FilesManager } = require('turbocommons-ts');
const path = require('path');
var fs = require('fs');
const setupModule = require('./setup');
const console = require('./console.js');
let validate = require('jsonschema').validate;


let fm = new FilesManager(require('fs'), require('os'), require('path'), process);


/**
 * Array that will contain all the warnings detected by this script and will be displayed at the end
 */
let warnings = [];


/**
 * Array that will contain all the errors detected by this script and will be displayed at the end
 */
let errors = [];


/**
 * Perform all the validation tasks
 */
exports.execute = function (verbose = true) {
    
    if(verbose){
    
        console.log("\nvalidate start");
    }
    
    validateJSONSchema(global.runtimePaths.root + fm.dirSep() + global.fileNames.setup, 'turbobuilder.schema.json');
    
    validateProjectStructure();
    
    validateStyleSheets();
    
    validateNamespaces();
    
    validateCopyrightHeaders();
    
    validatePackageAndTurboBuilderJsonIntegrity();
    
    if(global.setup.build.site_php){
        
        validateSitePhp();
    }
    
    // Use angular cli to run the tslint verification for angular projects
	if(global.setup.build.app_angular || global.setup.build.lib_angular){
    
	    console.log("\nLaunching ng lint");
        
	    if(!console.exec('ng lint', '', true)){
	        
	        console.error("validate failed");
	    }	    
    }
    
    console.errors(errors);
    
    // Reaching here means validation was successful
    console.success("validate ok");
}


/**
 * Check the current builder version and the one specified on setup json and if they are different, launch a warning
 */
exports.validateBuilderVersion = function () {
    
    let expectedVersion = StringUtils.trim(global.setup.metadata.builderVersion);
    
    if(StringUtils.isEmpty(expectedVersion)){
        
        console.error("metadata.builderVersion not specified on " + global.fileNames.setup);
    }
    
    if(expectedVersion !== setupModule.getBuilderVersion()){
    
        console.warning("Warning: Current turbobuilder version (" + setupModule.getBuilderVersion() + ") does not match expected (" + expectedVersion + ")");
    }
}


/**
 * Auxiliary method to validate that only the allowed contents exist on the specified folders
 */
let validateAllowedFolders = function (foldersToInspect, allowedContents){
    
    for(let i = 0; i < foldersToInspect.length; i++){
        
        var inspectedList = getFoldersList(foldersToInspect[i]);
        
        for(let j = 0; j < inspectedList.length; j++){
            
            if(!inArray(inspectedList[j], allowedContents)){
                    
                errors.push(inspectedList[j] + " is not allowed inside " + foldersToInspect[i]);
            }                       
        }
    }
}


/**
 * Validates all the affected JSON Schemas
 */
let validateJSONSchema = function (filePath, schemaFileName) {
    
    let schemasPath = global.installationPaths.mainResources + fm.dirSep() + 'json-schema';
    
    // Validate the received path
    if(!fm.isFile(filePath)){
        
        console.error("Could not find " + StringUtils.getPathElement(filePath) + " at " + filePath);
    }
    
    let fileContent = '';
    
    try{
    
        fileContent = JSON.parse(fm.readFile(filePath));
        
    }catch(e){
        
        errors.push("Corrupted JSON for " + StringUtils.getPathElement(filePath) + ":\n" + e.toString());
        
        return;
    }
    
    let schemaContent = JSON.parse(fm.readFile(schemasPath + fm.dirSep() + schemaFileName));
    
    let results = validate(fileContent, schemaContent);
    
    if(!results.valid){
        
        errors.push("Invalid JSON schema for " + StringUtils.getPathElement(filePath) + ":\n" + results.errors[0]);
    }
}


/**
 * Validates the project structure
 */
let validateProjectStructure = function () {
    
    let sep = fm.dirSep();
    let extrasPath = global.runtimePaths.root + sep + global.folderNames.extras;
    
    // Validate README.md main file is mandatory
    if(global.setup.validate.projectStructure.readmeFileMandatory &&
        !fm.isFile(global.runtimePaths.root + sep + global.fileNames.readme)){
     
         errors.push(global.runtimePaths.root + sep + global.fileNames.readme +
                 " does not exist.\nSet readmeFileMandatory = false to disable this error");
     }
    
    // Validate extras folder is mandatory
    if(global.setup.validate.projectStructure.extrasFolderMandatory && !fm.isDirectory(extrasPath)){
    
        errors.push(extrasPath + " does not exist.\nSet extrasFolderMandatory = false to disable this error");
    }
    
    // Validate all mandatory folders inside the extras folder
    if(global.setup.validate.projectStructure.extrasSubFoldersMandatory){
         
        for (let folder of global.setup.validate.projectStructure.extrasSubFoldersMandatory) {
            
            if(!fm.isDirectory(extrasPath + sep + folder)){
                
                errors.push(extrasPath + sep + folder +
                    " does not exist.\nRemove it from extrasSubFoldersMandatory to disable this error");
            }
        }
    }
    
    // Validate extras/todo folder contains .todo files
    if(global.setup.validate.projectStructure.extrasTodoExtension && fm.isDirectory(extrasPath + sep + 'todo')){
        
        for (let file of fm.getDirectoryList(extrasPath + sep + 'todo')){

            if(StringUtils.getPathExtension(file) !== 'todo'){
                
                errors.push(extrasPath + sep + 'todo' +  sep + file +
                    " must have .todo extension.\nSet extrasTodoExtension = false to disable this error");
            }
        }
    }
    
    // TODO - Validate that all folders inside src/main are the expected.
    
    // TODO - validate the case for all the files and folders
    
    // TODO - validate that gitIgnore file structure is correct
    
    // TODO - Check that no strange files or folders exist
    //validateAllowedFolders([global.runtimePaths.main, global.runtimePaths.test], ["css", "js", "ts", "php", "java", "resources"]);
}


/**
 * Validates the project css style sheets
 */
let validateStyleSheets = function () {
    
    if(!fm.isDirectory(global.runtimePaths.main + fm.dirSep() + 'view')){
        
        return;
    }
    
    let cssFiles = fm.findDirectoryItems(global.runtimePaths.main + fm.dirSep() + 'view', /^.*\.(css|scss)$/i, 'absolute', 'files');
    
    for (let cssFile of cssFiles){
        
        let cssContents = fm.readFile(cssFile);
        
        // Check if css hardcoded colors are forbidden
        if(global.setup.validate.styleSheets.noCssHardcodedColors &&
           /^(?!\$).*:.*(#|rgb).*$/im.test(cssContents)) {
                
            errors.push("File contains hardcoded css color: " + cssFile);
        }
    }
}


/**
 * Validates the copyright headers
 */
let validateCopyrightHeaders = function () {
    
    for (let validator of global.setup.validate.copyrightHeaders) {
    
        let header = fm.readFile(global.runtimePaths.root + fm.dirSep() + validator.path).replace(/(?:\r\n|\r|\n)/g, "\n");
        
        let regex = new RegExp('^.*(' + validator.includes.join('|') + ')$', 'i');
        
        let filesToValidate = fm.findDirectoryItems(global.runtimePaths.root + fm.dirSep() + validator.appliesTo, regex, 'absolute', 'files');
        
        for (let fileToValidate of filesToValidate){
            
            let fileIsExcluded = false;
            
            for(let excluded of validator.excludes){
               
                if(fileToValidate.indexOf(excluded) >= 0){
                    
                    fileIsExcluded = true;
                }
            }
            
            if(!fileIsExcluded && fm.readFile(fileToValidate).replace(/(?:\r\n|\r|\n)/g, "\n").indexOf(header) !== 0){
                
                errors.push("Bad copyright header:\n" + fileToValidate + "\nMust be as defined in " + validator.path + "\n");
            }
        }
    }
}


/**
 * Validates the Name spaces
 */
let validateNamespaces = function () {
    
    // Auxiliary function to perform namespace validations
    function validate(namespaceToCheck, fileAbsolutePath, mustContainList){
        
        if(mustContainList.length > 0){
            
            let fileRelativePath = fileAbsolutePath.split('src' + fm.dirSep())[1];
            let pathToReplace = StringUtils.replace(fileRelativePath, fm.dirSep() + StringUtils.getPathElement(fileRelativePath), '');
            
            for (let mustContain of mustContainList){
                
                // Replace the wildcards on the mustContain
                mustContain = mustContain.replace('$path', pathToReplace);
                
                for(var i = 0; i < StringUtils.countPathElements(fileAbsolutePath); i++){
                    
                    mustContain = mustContain.replace('$' + String(i), StringUtils.getPathElement(fileAbsolutePath, i));
                }
                
                if(namespaceToCheck.indexOf(mustContain) < 0){
                    
                    return mustContain;
                }
            }
        }
            
        return '';
    }
    
    if(global.setup.validate.phpNamespaces &&
       global.setup.validate.phpNamespaces.enabled){
        
        let filesToValidate = fm.findDirectoryItems(global.runtimePaths.main + fm.dirSep() + 'php', /.*\.php$/i, 'absolute', 'files');
        
        for (let fileToValidate of filesToValidate){
            
            let fileIsExcluded = false;
            
            for(let excluded of global.setup.validate.phpNamespaces.excludes){
               
                if(fileToValidate.indexOf(excluded) >= 0){
                    
                    fileIsExcluded = true;
                }
            }
            
            if(!fileIsExcluded){
                
                var fileContents = fm.readFile(fileToValidate);
                
                if(fileContents.indexOf("namespace") >= 0){
    
                    var namespace = StringUtils.trim(fileContents.split("namespace")[1].split(";")[0]);
                    
                    var validateNamespace = validate(namespace, fileToValidate, global.setup.validate.phpNamespaces.mustContain);
                    
                    if(validateNamespace !== ''){
                    
                        errors.push('Namespace error: "' + namespace + '" Must contain "' + validateNamespace + '" on file:\n' + fileToValidate);
                    }   
                    
                }else{
                    
                    if(global.setup.validate.phpNamespaces.mandatory){
                    
                        errors.push("File does not contain a namespace declaration: " + fileToValidate);
                    }           
                }
            }
        }       
    }
}


/**
 * Make sure that turbobuilder.json and package.json (if it exists) share the same common property values
 */
let validatePackageAndTurboBuilderJsonIntegrity = function () {
    
    let sep = fm.dirSep();
    let setupPath = global.runtimePaths.root + sep + global.fileNames.setup;
    let packagePath = global.runtimePaths.root + sep + 'package.json';
    
    // Angular library package is located inside projects/library-name
    if(global.setup.build.lib_angular){

        packagePath = global.runtimePaths.root + sep + 'projects' + sep + setupModule.getProjectName() + sep + 'package.json';
    }
    
    // If package.json does not exist we won't vaidate anything
    if(!fm.isFile(packagePath)){
        
        return;
    }
    
    let setup = JSON.parse(fm.readFile(setupPath));
    let packageJson = JSON.parse(fm.readFile(packagePath));
    
    if(setup.metadata.name !== packageJson.name ||
       setup.metadata.description !== packageJson.description){
   
        errors.push("\nName and description must match between the following files:\n" + setupPath + "\n" + packagePath);
    }
}


/**
 * Validates a site php project
 */
let validateSitePhp = function () {

    // Validate the turbosite.json schema
    validateJSONSchema(global.runtimePaths.root + fm.dirSep() + global.fileNames.turboSiteSetup, 'turbosite.schema.json');
    
    // Validate js files
    let jsFiles = fm.findDirectoryItems(global.runtimePaths.main, /^.*\.(js)$/i, 'absolute', 'files');
    
    for (let jsFile of jsFiles){
        
        // Files inside the src/main/libs folder won't be verified
        if(jsFile.includes('src/main/libs') || jsFile.includes('src\\main\\libs')){
            
            continue;
        }
        
        let jsContents = fm.readFile(jsFile);
        
        // All project js files must contain "use strict" at the very first beginning of the file
        if(global.setup.validate.sitePhp.jsUseStrict &&
           jsContents.indexOf('"use strict"') !== 0) {
                
            errors.push('File must start with "use strict": ' + jsFile);
        }
    }
    
}