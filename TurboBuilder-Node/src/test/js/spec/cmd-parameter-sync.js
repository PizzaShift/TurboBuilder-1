#!/usr/bin/env node
'use strict';


/**
 * Tests related to the sync feature of the cmd app
 */


const utils = require('../cmd-parameter-test-utils');
const { TerminalManager } = require('turbodepot-node');


const terminalManager = new TerminalManager();


describe('cmd-parameter-sync', function(){

    beforeEach(function(){

        this.workdir = terminalManager.createTempDirectory('test-sync');
    });


    afterEach(function(){

        switchToExecutionDir();

        expect(utils.fm.deleteDirectory(this.workdir)).toBeGreaterThan(-1);
    });


    it('should fail when -s and --sync arguments are executed on an empty folder', function(){

        expect(utils.exec('-s')).toContain(global.fileNames.setup + ' setup file not found');
        expect(utils.exec('--sync')).toContain(global.fileNames.setup + ' setup file not found');
    });


    it('should fail when -s and --sync arguments are executed on an empty setup file build structure', function(){

        utils.generateProjectAndSetTurbobuilderSetup('site_php', {}, []);

        expect(utils.exec('-s')).toContain('No valid project type specified');
        expect(utils.exec('--sync')).toContain('No valid project type specified');
    });


    it('should fail on a generated project that has no target folder', function(){

        utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);

        expect(utils.exec('-s')).toContain('Source path does not exist:');
        expect(utils.exec('--sync')).toContain('Source path does not exist:');
    });


    it('should not sync (runAfterBuild) by default when a site_php project is generated', function(){

        utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);

        let testsLaunchResult = utils.exec('-b');
        expect(testsLaunchResult).toContain("build start: site_php");
        expect(testsLaunchResult).not.toContain("sync ok to fs");
    });


    it('should sync to another folder when fileSystem sync is enabled', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);
        
        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder)).toBe(true);

        setup.sync = {
            "runAfterBuild" : false,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder,
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : false
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        expect(utils.exec('-bs')).toContain('sync ok to fs');

        expect(utils.fm.isDirectory(destFolder + utils.fm.dirSep() + 'site')).toBe(true);

        expect(utils.fm.deleteDirectory(destFolder, false)).toBeGreaterThan(-1);

        expect(utils.exec('--build --sync')).toContain('sync ok to fs');

        expect(utils.fm.isDirectory(destFolder + utils.fm.dirSep() + 'site')).toBe(true);

        // Sync must fail the second time due to a non empty destination folder
        expect(utils.exec('-s')).toContain('Destination path is not empty');

        // Modify setup to allow delete dest path and try again
        setup.sync.deleteDestPathContents = true;
        expect(utils.saveToSetupFile(setup)).toBe(true);

        expect(utils.exec('-s')).toContain('sync ok to fs');
        expect(utils.fm.isDirectory(destFolder + utils.fm.dirSep() + 'site')).toBe(true);
    });


    it('should sync automatically to another folder when filesystem sync enabled, runAfterBuild is true and -b is called', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);

        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder)).toBe(true);

        setup.sync = {
            "runAfterBuild" : true,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder,
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : false
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        let testsLaunchResult = utils.exec('-b');
        expect(testsLaunchResult).toContain("sync ok to fs");
    });


    it('should not execute filesystem sync two times when runAfterBuild is false and -bs is called via cmd', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);

        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder)).toBe(true);

        setup.sync = {
            "runAfterBuild" : false,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder,
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : false
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        let testsLaunchResult = utils.exec('-bs');
        expect(testsLaunchResult).toContain("sync ok to fs");
        expect(testsLaunchResult).toContain("sync start");
        expect(testsLaunchResult.split("sync ok to fs").length - 1).toBe(1);
    });


    it('should not execute filesystem sync two times when runAfterBuild is true and -bs is called via cmd', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);

        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder)).toBe(true);

        setup.sync = {
            "runAfterBuild" : true,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder,
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : false
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        let testsLaunchResult = utils.exec('-bs');
        expect(testsLaunchResult).toContain("sync ok to fs");
        expect(testsLaunchResult).not.toContain("sync start");
        expect(testsLaunchResult.split("sync ok to fs").length - 1).toBe(1);
    });


    it('should sync release to another folder when fileSystem sync is enabled', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);

        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder)).toBe(true);

        // Create a raw file on the dest folder, so we can check that it gets removed after sync due to the
        // deleteDestPathContents being enabled
        expect(utils.fm.saveFile(destFolder + utils.fm.dirSep() + 'some-raw-file-to-be-deleted.txt', 'content')).toBe(true);
        expect(utils.fm.isFile(destFolder + utils.fm.dirSep() + 'some-raw-file-to-be-deleted.txt')).toBe(true);

        setup.sync = {
            "runAfterBuild" : false,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder,
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : true
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        expect(utils.exec('-rs')).toContain('sync ok to fs');

        expect(utils.fm.isFile(destFolder + utils.fm.dirSep() + 'some-raw-file-to-be-deleted.txt')).toBe(false);
        expect(utils.fm.isDirectory(destFolder + utils.fm.dirSep() + 'site')).toBe(true);

        expect(utils.fm.deleteDirectory(destFolder, false)).toBeGreaterThan(-1);

        expect(utils.exec('--release --sync')).toContain('sync ok to fs');

        expect(utils.fm.isDirectory(destFolder + utils.fm.dirSep() + 'site')).toBe(true);
    });


    it('should sync release to another folder when fileSystem sync is enabled and runAfterBuild is true', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);
        
        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder)).toBe(true);

        setup.sync = {
            "runAfterBuild" : true,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder,
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : false
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        let testsLaunchResult = utils.exec('-r');
        expect(testsLaunchResult).toContain("sync ok to fs");
        expect(testsLaunchResult).not.toContain("sync start");
        expect(testsLaunchResult.split("sync ok to fs").length - 1).toBe(1);
    });


    it('should sync release to a folder as overrided by turbobuilder.release.json when filesystem sync is enabled', function(){

        let setup = utils.generateProjectAndSetTurbobuilderSetup('site_php', null, []);
        
        let destFolder = this.workdir + utils.fm.dirSep() + 'destinationfolder';

        expect(utils.fm.createDirectory(destFolder + '-build')).toBe(true);
        expect(utils.fm.createDirectory(destFolder + '-release')).toBe(true);

        setup.sync = {
            "runAfterBuild" : false,
            "type" : "fileSystem",
            "excludes" : [],
            "sourcePath" : "dist/",
            "destPath" : destFolder + '-build',
            "remoteUrl" : "http://localhost",
            "deleteDestPathContents" : true
        };

        expect(utils.saveToSetupFile(setup)).toBe(true);

        // Create a setup file that overrides the destpath to a different location
        utils.fm.saveFile('.' + utils.fm.dirSep() + global.fileNames.setupRelease, JSON.stringify({
            "sync" : {
                "destPath" : destFolder + '-release'
            }
        }));

        // Verify that release generates the files into the -release folder
        expect(utils.exec('-rs')).toContain('sync ok to fs');

        expect(utils.fm.isDirectoryEmpty(destFolder + '-build')).toBe(true);
        expect(utils.fm.isDirectoryEmpty(destFolder + '-release')).toBe(false);
        expect(utils.fm.isDirectory(destFolder + '-release' + utils.fm.dirSep() + 'site')).toBe(true);
    });
});