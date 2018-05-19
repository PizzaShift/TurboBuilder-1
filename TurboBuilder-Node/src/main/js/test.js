'use strict';

/**
 * this module contains all the code related to the test process
 */


const { FilesManager } = require('turbocommons-ts');
const { spawn } = require('child_process');
const console = require('./console');
const buildModule = require('./build');
const releaseModule = require('./release');
const opn = require('opn');


let fm = new FilesManager(require('fs'), require('os'), require('path'), process); 


/**
 * Execute the test process
 */
exports.execute = function (build, release) {
    
    console.log("\ntest start");
    
    if(!ArrayUtils.isArray(global.setup.test) || global.setup.test.length < 0){
        
        console.error("Nothing to test. Please setup some tests on test section in " + global.fileNames.setup);
    }
    
    // Check which build paths must be tested
    let pathsToTest = [];
    
    if(build){
        
        pathsToTest.push(buildModule.getBuildRelativePath());
    }
    
    if(release){
        
        pathsToTest.push(releaseModule.getReleaseRelativePath());
    }
    
    if(global.setup.test.php.enabled){
        
        testPhp(pathsToTest);
    }
    
    if(global.setup.test.ts.enabled){
        
        testTypeScript(pathsToTest);
    }
    
    console.success('test done');
};


/**
 * Initiate an http server instance using the project target folder as the root.
 * If a server is already using the currently configured port, the new instance will not start.
 * This is useful cause we will be able to leave the created http server instance open all the time
 * while we perform different test executions
 */
let launchHttpServer = function () {
    
    // Initialize an http server as an independent terminal instance, with the dest folder as the http root
    // and with the cache disabled. It will silently fail if a server is already listening the configured port
    let httpServerCmd = global.installationPaths.httpServerBin;
    
    httpServerCmd += ' "' + global.runtimePaths.target + '"';
    httpServerCmd += ' -c-1';
    httpServerCmd += ' -p ' + global.setup.test.ts.httpServerPort;
    
    spawn(httpServerCmd, [], {shell: true, stdio: 'ignore', detached: true}).unref();    
   
    console.success('started http-server');
}


/**
 * Execute the Php tests
 * 
 * @param relativeBuildPaths A list with paths relative to project target folder,
 *        where tests folder and files will be created and executed
 */
let testPhp = function (relativeBuildPaths) {

    if(!global.setup.build.lib_php){
        
        console.error('build.lib_php is mandatory on ' + global.fileNames.setup + ' to run php tests');
    }
    
    let sep = fm.dirSep();
    let srcTestsPath = global.runtimePaths.test + sep + 'php';
    
    for (let relativeBuildPath of relativeBuildPaths) {
    
        let destPath = global.runtimePaths.target + sep + relativeBuildPath;
        let destTestsPath = destPath + sep + 'test' + sep + 'php';
        let coverageReportPath = destPath + sep + 'coverage' + sep + 'php';
        
        fm.createDirectory(destTestsPath, true);
        
        // Copy all tests source code
        fm.copyDirectory(srcTestsPath, destTestsPath);
        
        console.success("launching php tests at:\n");
        console.success(destTestsPath + "\n");
        
        // Launch unit tests via php executable
        let phpExecCommand = 'php';
        
        phpExecCommand += ' "' + global.installationPaths.mainResources + sep + 'libs' + sep + 'phpunit-6.2.3.phar"';
        
        if(global.setup.test.php.coverageReport){
            
            console.warning("Warning: Enabling Php coverage report in unit tests is many times slower");
            
            phpExecCommand += ' --coverage-html "' + coverageReportPath + '"';                           
        }
        
        phpExecCommand += ' --configuration "' + destTestsPath + sep + 'PhpUnitSetup.xml"';     
        phpExecCommand += ' "' + destPath + '/"';
        
        let testsResult = console.exec(phpExecCommand, '', true);
                    
        // Open the coverage report if necessary
        if(global.setup.test.php.coverageReport &&
                global.setup.test.php.coverageReportOpenAfterTests){
        
            // opn is a node module that opens resources in a cross os manner
            opn(coverageReportPath + sep + 'index.html', {wait: false});
        }  
        
        if(!testsResult){
    
            console.error('There are PHP unit test failures');
        }   
    }
}


/**
 * Execute the typescript tests
 * 
 * @param relativeBuildPaths A list with paths relative to project target folder,
 *        where tests folder and files will be created and executed
 */
let testTypeScript = function (relativeBuildPaths) {
    
    console.success("launching ts tests");
    
    if(!global.setup.build.lib_ts){
        
        console.error('build.lib_ts is mandatory on ' + global.fileNames.setup + ' to run typescript tests');
    }
    
    let sep = fm.dirSep();
    let srcTestsPath = global.runtimePaths.test + sep + 'ts';
    
    launchHttpServer();
    
    for (let relativeBuildPath of relativeBuildPaths) {
        
        let destPath = global.runtimePaths.target + sep + relativeBuildPath;
        let destTestsPath = destPath + sep + 'test';
        
        fm.createDirectory(destTestsPath, true);
        
        // Generate all the files to launch the tests
        for (let tsTargetObject of global.setup.build.lib_ts.targets) {
            
            if(global.setup.test.ts.targets.indexOf(tsTargetObject.folder) >= 0){
                
                let jsTarget = tsTargetObject.jsTarget;
                let testsTarget = destTestsPath + sep + tsTargetObject.folder;
                
                // Create current jsTarget folder
                if(!fm.createDirectory(testsTarget, true)){
                    
                    console.error('Could not create ' + testsTarget);
                }
                
                // Merge all tests code into tests target
                fm.mergeFiles(fm.findDirectoryItems(srcTestsPath, /.*\.js$/i, 'absolute', 'files'),
                        testsTarget + sep + 'tests.js', "\n\n");
        
                // Copy all test resources
                fm.createDirectory(testsTarget + sep + 'resources');
                fm.copyDirectory(srcTestsPath + sep + 'resources', testsTarget + sep + 'resources');
                
                // Merge all src dist code into tests target
                fm.mergeFiles(fm.findDirectoryItems(destPath + sep + 'dist' + sep + tsTargetObject.folder, /.*\.js$/i, 'absolute', 'files'),
                        testsTarget + sep + 'build.js', "\n\n");
        
                // Copy qunit library
                if(!fm.copyDirectory(global.installationPaths.testResources + sep + 'libs' + sep + 'qunit', testsTarget, false)){
                    
                    console.error('Could not copy qunit library');
                }
            
                // Generate index.html if not exists
                if(fm.isFile(srcTestsPath + sep + 'index.html')){
                    
                    // TODO - copy index.html to target
                    
                }else{
                    
                    let htmlIndexCode = '<!DOCTYPE html>';            
                    htmlIndexCode += '<html>';
                    htmlIndexCode += '<head>';
                    htmlIndexCode += '<meta charset="utf-8">';
                    htmlIndexCode += '<meta name="viewport" content="width=device-width">';
                    htmlIndexCode += '<title>Tests results</title>';
                    htmlIndexCode += '<link rel="stylesheet" href="qunit-2.6.0.css">';
                    htmlIndexCode += '</head>';
                    htmlIndexCode += '<body>';
                    htmlIndexCode += '<div id="qunit"></div>';
                    htmlIndexCode += '<div id="qunit-fixture"></div>';
                    htmlIndexCode += '<script src="qunit-2.6.0.js"></script>';
                    htmlIndexCode += '<script src="build.js"></script>';
                    htmlIndexCode += '<script src="tests.js"></script>';
                    htmlIndexCode += '</body>';
                    htmlIndexCode += '</html>';
                    
                    if(!fm.saveFile(testsTarget + sep + 'index.html', htmlIndexCode)){
                        
                        console.error('Could not create ' + testsTarget + sep + 'index.html');
                    }
                }
                
                // Run tests on all configured browsers
                for (let browserName of Object.keys(global.setup.test.ts.browsers)) {
                    
                    if(global.setup.test.ts.browsers[browserName]){
                        
                        let httpServerUrl = 'http://localhost:' + global.setup.test.ts.httpServerPort + '/';
                        
                        httpServerUrl += relativeBuildPath + '/test/' + tsTargetObject.folder;
                        
                        // opn is a node module that opens resources in a cross os manner
                        opn(httpServerUrl, {wait: false, app: [browserName]});
                    }
                }
            }
        }
    }
}