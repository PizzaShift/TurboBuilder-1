'use strict';

/**
 * this module contains all the code related to the project validation
 */


const { StringUtils, ObjectUtils } = require('turbocommons-ts');
const path = require('path');
var fs = require('fs');


/**
 * Array that will contain all the warnings detected by this script and will be displayed at the end
 */
let warnings = [];


/**
 * Array that will contain all the errors detected by this script and will be displayed at the end
 */
let errors = [];


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
 * Validates the project structure
 */
let validateProjectStructure = function () {
    
    if(!global.setupValidate.ProjectStructure.enabled){
    
        return;
    }
    
    // Check that all the project mandatory folders and files exist
    for (let key of ObjectUtils.getKeys(global.runtimePaths)) {
        
        // Ignore files that are not mandatory or disabled via setup
        if(key === 'target' ||
           (key === 'extras' && !global.setupValidate.ProjectStructure.forceExtrasFolder) ||
           (key === 'readmeFile' && !global.setupValidate.ProjectStructure.forceReadmeFile) ||
           (key === 'todoFile' && !global.setupValidate.ProjectStructure.forceTODOFile)){
            
            continue;
        }
        
        if (!fs.existsSync(global.runtimePaths[key])) {
            
            errors.push(global.runtimePaths[key] + " does not exist");
        }
    }
    
    // Check that no strange files or folders exist
    //validateAllowedFolders([global.runtimePaths.main, global.runtimePaths.test], ["css", "js", "ts", "php", "java", "resources"]);
    
    // Validate that gitIgnore file is correct
    if(global.setupValidate.ProjectStructure.checkGitIgnore === true){
        
        // TODO - validate git ignore    
    }   
}


/**
 * Perform all the validation tasks
 */
exports.execute = function () {
    
    validateProjectStructure();
     
    // If errors happened, show them and quit 
    if(errors.length > 0){

        for(var i = 0; i < errors.length; i++){
            
            console.log('Validation error: ' + errors[i]);
        }
        
        process.exit(1);
    }
}