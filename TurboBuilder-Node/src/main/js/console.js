'use strict';

/**
 * this module contains utilities for application console output
 */


const { FilesManager, StringUtils } = require('turbocommons-ts');
const { execSync } = require('child_process');


let fm = new FilesManager(require('fs'), require('os'), require('path'), process);


/**
 * Show a standard message to the user
 */
exports.log = function (message) {
    
    console.log(message);
}


/**
 * Show a success to the user
 * If quit parameter is true, the application will also exit with success code 0
 */
exports.success = function (message, quit = false) {
    
    console.log('\x1b[32m%s\x1b[0m', message);
    
    if(quit){
        
        process.exit(0);
    }
}


/**
 * Show a warning to the user
 * If quit parameter is true, the application will also exit with error code 1
 */
exports.warning = function (message, quit = false) {
    
    console.log('\x1b[33m%s\x1b[0m', message);
    
    if(quit){
        
        process.exit(1);
    }
}


/**
 * Show a multiple list of warnings to the user
 * If quit parameter is true, the application will also exit with error code 1 after all errors are output
 */
exports.warnings = function (messages, quit = false) {
    
    if(messages.length > 0){

        for(var i = 0; i < messages.length; i++){
            
            console.log('\x1b[33m%s\x1b[0m', messages[i]);
        }
        
        if(quit){
            
            process.exit(1);
        }
    }    
}


/**
 * Show an error to the user
 * If quit parameter is true, the application will also exit with error code 1
 */
exports.error = function (message, quit = true) {
    
    console.log('\x1b[31m%s\x1b[0m', message);
    
    if(quit){
        
        process.exit(1);
    }
}

/**
 * Show a multiple list of errors to the user
 * If quit parameter is true, the application will also exit with error code 1 after all errors are output
 */
exports.errors = function (messages, quit = true) {
    
    if(messages.length > 0){

        for(var i = 0; i < messages.length; i++){
            
            console.log('\x1b[31m%s\x1b[0m', messages[i]);
        }
        
        if(quit){
            
            process.exit(1);
        }
    }    
}


/**
 * Show the contents of the Todo file if any
 */
exports.printTodoFile = function () {

    if(fm.isFile(global.runtimePaths.todoFile)){
        
        let todoContents = fm.readFile(global.runtimePaths.todoFile);
        
        if(!StringUtils.isEmpty(todoContents)){
        
            this.warning("\nPENDING TASKS inside : " + global.fileNames.todo + "\n");
                    
            this.warning(todoContents + "\n");
        }
    }
}


/**
 * Execute the specified cmd command and show the result on the console
 * 
 * @param shellCommand The command to execute
 * @param successMessage Message to show when command finishes ok in case the command output is not defined
 * @param liveOutput Set it to true to show the exec stdout in real time to the console
 */
exports.exec = function (shellCommand, successMessage = '', liveOutput = false) {
    
    if(liveOutput){
        
        try{
            
            execSync(shellCommand, {stdio:[0,1,2]});
            
            if(successMessage !== ''){
                
                this.success(successMessage); 
            }
            
            return true;
            
        }catch(e){

            return false;
        }
        
    }else{
    
        try{
            
            let result = execSync(shellCommand, {stdio : 'pipe'}).toString();
            
            if(successMessage !== ''){
                
                this.success(successMessage);
                
            }else if(!StringUtils.isEmpty(result)){
                
                this.success(result);
            }
            
            return true;
            
        }catch(e){

            if(StringUtils.isEmpty(e.stdout.toString())){
                
                this.error('Unknown error executing ' + shellCommand);
                
            }else{
             
                this.error(e.stdout.toString() + '\n' + e.toString());
            }        
        }
    }
}