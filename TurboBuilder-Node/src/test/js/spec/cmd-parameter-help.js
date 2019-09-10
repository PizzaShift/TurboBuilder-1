#!/usr/bin/env node

'use strict';


/**
 * Tests related to the help feature of the cmd app
 */


const utils = require('../cmd-parameter-test-utils');
const { TerminalManager } = require('turbodepot-node');


const terminalManager = new TerminalManager();


describe('cmd-parameter-help', function() {
    
    beforeEach(function() {
        
        this.workdir = terminalManager.createTempDirectory('test-help');
    });

    
    afterEach(function() {
  
        switchToExecutionDir();
        
        expect(utils.fm.deleteDirectory(this.workdir)).toBeGreaterThan(-1);
    });
    
    
    it('should show help when no arguments are passed', function() {

        expect(utils.exec('')).toContain("Usage: turbobuilder|tb [options]");
    }); 
    
    
    it('should show help when -h and --help arguments are passed', function() {

        expect(utils.exec('-h')).toContain("Usage: turbobuilder|tb [options]");
        expect(utils.exec('--help')).toContain("Usage: turbobuilder|tb [options]");
    });
    
    
    it('should show help when -h and --help arguments are passed after creating an empty project', function() {

        utils.exec('-g lib_php');
        
        expect(utils.exec('-h')).toContain("Usage: turbobuilder|tb [options]");
        expect(utils.exec('--help')).toContain("Usage: turbobuilder|tb [options]");
    });
    
    it('should show help when no arguments are passed after creating an empty project', function() {

        utils.exec('-g lib_php');
        
        expect(utils.exec('')).toContain("Usage: turbobuilder|tb [options]");
    });
});