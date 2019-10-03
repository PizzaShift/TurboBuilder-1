#!/usr/bin/env node

'use strict';


/**
 * Contains tests that check the behaviour of a site_php web services by performing multiple request scenarios with different
 * POST and GET parameters
 */

const utils = require('../sitephp-test-utils');
const { HTTPTestsManager } = require('turbotesting-node');

const httpTestsManager = new HTTPTestsManager();


describe('web-services', function() {


    beforeAll(function() {

        jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000;
        
        this.baseUrl = "https://$host/api/site/example/";
        httpTestsManager.wildcards = utils.generateWildcards();
    });

    
    afterAll(function() {

        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.originalTimeout;
    });
    
    
    beforeEach(function() {

    });
    
    
    afterEach(function() {

    });
    
    
    it('should correctly load the ExampleServiceWithoutParams when no parameters are passed', function(done) {
        
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-without-params',
            contains: ['Any value can be output by the service as a string (json or xml data, plain text, etc..)']
        }], (responses) => { done() });
    });
    
    
    it('should fail the ExampleServiceWithoutParams when GET parameters are passed', function(done) {

        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-without-params/param0/param1',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithoutParams when WRONG GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-without-params/unexpected-param',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        },{
            url: this.baseUrl + 'example-service-without-params/unexpected-param1/unexpected-param2',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        },{
            url: this.baseUrl + 'example-service-without-params/&& &&   /&&&  /-----???',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithoutParams when POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-without-params',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithoutParams when WRONG POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-without-params',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string",
                "extravariable": "some extra value"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParams when no parameters are passed', function(done) {
        
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params',
            responseCode: 500,
            contains: ['"code":500', 'Missing mandatory GET parameter at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        },{
            url: this.baseUrl + 'example-service-with-get-params/param1',
            responseCode: 500,
            contains: ['"code":500', 'Missing mandatory GET parameter at 1'],
            notContains: ['turbosite-global-error-manager-problem']
        },{
            url: this.baseUrl + 'example-service-with-get-params/param1/param2/param3',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 2'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceWithGetParams when GET parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-get-params/param1/param2',
            contains: ['{"info":"this object is returned as a json string with the received GET parameters values","received-param-0-value":"param1","received-param-1-value":"param2"}']
        }], (responses) => { done() });
    });
    
    
    it('should fail the ExampleServiceWithGetParams when WRONG GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params/param1/param2/param3/param4',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 2'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParams when POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Missing mandatory GET parameter at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParams when WRONG POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params/param1/param2',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string",
                "extradata": "some extra value",
                "more extra data": "&&--!!..."
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParams when GET and POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params/param1/param2',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceWithGetParamsOptional when no parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-get-params-optional',
            contains: ['{"info":"this object is returned as a json string with the optionally received GET parameters values","received-param-0-value":"","received-param-1-value":"","received-param-2-value":"","received-param-3-value":""}']
        }], (responses) => { done() });
    });
    
    
    it('should correctly load the ExampleServiceWithGetParamsOptional when GET parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-get-params-optional/param1',
            contains: ['{"info":"this object is returned as a json string with the optionally received GET parameters values","received-param-0-value":"param1","received-param-1-value":"","received-param-2-value":"","received-param-3-value":""}']
        },
        {
            url: this.baseUrl + 'example-service-with-get-params-optional/param1/param2',
            contains: ['{"info":"this object is returned as a json string with the optionally received GET parameters values","received-param-0-value":"param1","received-param-1-value":"param2","received-param-2-value":"","received-param-3-value":""}']
        },
        {
            url: this.baseUrl + 'example-service-with-get-params-optional/param1/param2/param3',
            contains: ['{"info":"this object is returned as a json string with the optionally received GET parameters values","received-param-0-value":"param1","received-param-1-value":"param2","received-param-2-value":"param3","received-param-3-value":""}']
        },
        {
            url: this.baseUrl + 'example-service-with-get-params-optional/param1/param2/param3/param4',
            contains: ['{"info":"this object is returned as a json string with the optionally received GET parameters values","received-param-0-value":"param1","received-param-1-value":"param2","received-param-2-value":"param3","received-param-3-value":"param4"}']
        }], (responses) => { done() });
    });
    
    
    it('should fail the ExampleServiceWithGetParamsOptional when WRONG GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params-optional/param1/param2/param3/param4/param5',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 4'],
            notContains: ['turbosite-global-error-manager-problem']
        },
        {
            url: this.baseUrl + 'example-service-with-get-params-optional/param1/param2/param3/param4/param5/param6/param7',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 4'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParamsOptional when POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params-optional',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParamsOptional when WRONG POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params-optional',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string",
                "extradata": "some extra value",
                "more extra data": "&&--!!..."
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithGetParamsOptional when GET and POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-get-params-optional/param1/param2',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostParams when no parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-params',
            responseCode: 500,
            postParameters: {
            },
            contains: ['"code":500', 'Missing mandatory POST parameter: param1'],
            notContains: ['turbosite-global-error-manager-problem']
        },
        {
            url: this.baseUrl + 'example-service-with-post-params',
            responseCode: 500,
            postParameters: {
                "param1": "some arbitrary string"
            },
            contains: ['"code":500', 'Missing mandatory POST parameter: param2'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostParams when GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-params/param1/param2',
            responseCode: 500,
            postParameters: {
            },
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostParams when WRONG GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-params/param1/param2/===$$$$!!!!!!/   ---',
            responseCode: 500,
            postParameters: {
            },
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceWithPostParams when POST parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-post-params',
            postParameters: {
                "param1": "",
                "param2": "",
            },
            contains: ['{"info":"this object is returned as a json string with the received POST parameters","received-param1":"","received-param2":""}']
        },
        {
            url: this.baseUrl + 'example-service-with-post-params',
            postParameters: {
                "param1": "some arbitrary string",
                "param2": "param 2 value"
            },
            contains: ['{"info":"this object is returned as a json string with the received POST parameters","received-param1":"some arbitrary string","received-param2":"param 2 value"}']
        },
        {
            url: this.baseUrl + 'example-service-with-post-params',
            postParameters: {
                "param1": "some arbitrary string",
                "param2": ["this post parameter is sent as a javascript array that needs to be json encoded", "someString", 10]
            },
            contains: ['{"info":"this object is returned as a json string with the received POST parameters","received-param1":"some arbitrary string","received-param2":"[\\"this post parameter is sent as a javascript array that needs to be json encoded\\",\\"someString\\",10]"}']
        },
        {
            url: this.baseUrl + 'example-service-with-post-params',
            postParameters: {
                "param1": "some arbitrary string",
                "param2": {a: "this post parameter is sent as a javascript object that needs to be json encoded", b: "someString", c: 10}
            },
            contains: ['{"info":"this object is returned as a json string with the received POST parameters","received-param1":"some arbitrary string","received-param2":"{\\"a\\":\\"this post parameter is sent as a javascript object that needs to be json encoded\\",\\"b\\":\\"someString\\",\\"c\\":10}"}']
        }], (responses) => { done() });
    });
    
    
    it('should fail the ExampleServiceWithPostParams when WRONG POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-params',
            responseCode: 500,
            postParameters: {
                "param1": "some arbitrary string",
                "extradata": "some extra value"
            },
            contains: ['"code":500', 'Missing mandatory POST parameter: param2'],
            notContains: ['turbosite-global-error-manager-problem']
        },
        {
            url: this.baseUrl + 'example-service-with-post-params',
            responseCode: 500,
            postParameters: {
                "param1": "some arbitrary string",
                "param2": "some arbitrary string",
                "extradata": "some extra value"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: extradata'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostParams when GET and POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-params/param1/param2',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Unexpected GET parameter received at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
        
    
    it('should fail the ExampleServiceWithPostAndGetParams when no parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params',
            responseCode: 500,
            postParameters: {
            },
            contains: ['"code":500', 'Missing mandatory GET parameter at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostAndGetParams when GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params/param1/param2',
            responseCode: 500,
            postParameters: {
            },
            contains: ['"code":500', 'Missing mandatory POST parameter: data'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostAndGetParams when WRONG GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params/param1/param2/param3/param4',
            responseCode: 500,
            postParameters: {
            },
            contains: ['"code":500', 'Unexpected GET parameter received at 2'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostAndGetParams when POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['"code":500', 'Missing mandatory GET parameter at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should fail the ExampleServiceWithPostAndGetParams when WRONG POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string",
                "data2": "more data"
            },
            contains: ['"code":500', 'Missing mandatory GET parameter at 0'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceWithPostAndGetParams when GET and POST parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-post-and-get-params/param1/param2',
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['{"info":"this object is returned as a json string with the received GET and POST parameters values","received-GET-param-0-value":"param1","received-GET-param-1-value":"param2","received-POST-params":"some arbitrary string"}']
        }], (responses) => { done() });
    });
    
    
    it('should correctly load the ExampleServiceWithPostAndGetParamsOptional when no parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional',
            postParameters: {
            },
            contains: ['{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":null,"received-GET-param-0-value":"","received-GET-param-1-value":"","received-GET-param-2-value":""}']
        }], (responses) => { done() });
    });
    
    
    it('should correctly load the ExampleServiceWithPostAndGetParamsOptional when GET parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional/param1',
            postParameters: {
            },
            contains: ['{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":null,"received-GET-param-0-value":"param1","received-GET-param-1-value":"","received-GET-param-2-value":""}']
        },
        {
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional/param1/param2',
            postParameters: {
            },
            contains: ['{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":null,"received-GET-param-0-value":"param1","received-GET-param-1-value":"param2","received-GET-param-2-value":""}']
        }], (responses) => { done() });
    });
    
    
    it('should fail the ExampleServiceWithPostAndGetParamsOptional when WRONG GET parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional/param1/param2/param3/param4/param5',
            responseCode: 500,
            contains: ['"code":500', 'Unexpected GET parameter received at 3'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceWithPostAndGetParamsOptional when POST parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional',
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":"some arbitrary string","received-GET-param-0-value":"","received-GET-param-1-value":"","received-GET-param-2-value":""}']
        }], (responses) => { done() });
    });
    
    
    it('should fail the ExampleServiceWithPostAndGetParamsOptional when WRONG POST parameters are passed', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional',
            responseCode: 500,
            postParameters: {
                "data": "some arbitrary string",
                "extradata": "some more data"
            },
            contains: ['"code":500', 'Unexpected POST parameter received: extradata'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceWithPostAndGetParamsOptional when GET and POST parameters are passed', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-with-post-and-get-params-optional/param1/param2',
            postParameters: {
                "data": "some arbitrary string"
            },
            contains: ['{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":"some arbitrary string","received-GET-param-0-value":"param1","received-GET-param-1-value":"param2","received-GET-param-2-value":""}']
        }], (responses) => { done() });
    });
    
    
    it('should correctly load the ExampleServiceThatThrows400BadRequest with a 400 bad request response and the proper text on the body', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-that-throws-400-bad-request',
            responseCode: 400,
            contains: ['This is a bad request example', 'And this is the error message']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceThatThrows500UnhandledException with a 500 error response and the proper text on the body', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'example-service-that-throws-500-unhandled-exception',
            responseCode: 500,
            contains: ['Unhandled exception', 'This exception inside the run method is not being correctly handled (catched)']
        }], done);
    });
    
    
    it('should correctly load the ExampleServiceThatCallsAnotherOne', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: this.baseUrl + 'example-service-that-calls-another-one',
            contains: ['ExampleServiceWithoutParams called. Result:',
                       'Any value can be output by the service as a string (json or xml data, plain text, etc..)',
                       'ExampleServiceWithGetParams called. Result:',
                       '{"info":"this object is returned as a json string with the received GET parameters values","received-param-0-value":"param0","received-param-1-value":"param1"}',
                       'ExampleServiceWithGetParamsOptional called. Result',
                       '{"info":"this object is returned as a json string with the optionally received GET parameters values","received-param-0-value":"param0","received-param-1-value":"","received-param-2-value":"","received-param-3-value":""}',
                       'ExampleServiceWithPostParams called. Result:',
                       '{"info":"this object is returned as a json string with the received POST parameters","received-param1":"p1 value","received-param2":"p2 value"}',
                       'ExampleServiceWithPostAndGetParams called. Result:',
                       '{"info":"this object is returned as a json string with the received GET and POST parameters values","received-GET-param-0-value":"param0","received-GET-param-1-value":"param1","received-POST-params":"data from constructor"}',
                       'ExampleServiceWithPostAndGetParamsOptional called. Result:',
                       '{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":null,"received-GET-param-0-value":"","received-GET-param-1-value":"","received-GET-param-2-value":""}',
                       'ExampleServiceWithPostAndGetParamsOptional called 2. Result:',
                       '{"info":"this object is returned as a json string with the optionally received GET and POST parameters values","received-POST-param-data":"datavalue","received-GET-param-0-value":"p1","received-GET-param-1-value":"p2","received-GET-param-2-value":""}',
                       'ExampleServiceThatThrows400BadRequest called. Result:',
                       '{"code":400,"title":"This is a bad request example","message":"And this is the error message","trace":""}']
        }], (responses) => { done() });
    });
    
    
    it('should show a 404 error when trying to load a non existing web service', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: this.baseUrl + 'this-service-does-not-exist',
            responseCode: 404,
            contains: ['Error 404 page not found']
        }], done);
    });
    
    
    it('should return an empty result when no services are passed to the chain-services service', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: 'https://$host/api/turbosite/chain/chain-services',
            postParameters: {
                services: []
            },
            contains: ['[]']
        }], (responses) => { done() });
    });
    
    
    it('should return the result of one service: ExampleServiceWithoutParams if executed via the chain-services service with services being an encoded json array string', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: 'https://$host/api/turbosite/chain/chain-services',
            postParameters: {
                services: '[{ "uri": "api/site/example/example-service-without-params" }]'
            },
            contains: ['["Any value can be output by the service as a string (json or xml data, plain text, etc..)"]']
        }], (responses) => { done() });
    });
    
    
    it('should return the result of one service: ExampleServiceWithoutParams if executed via the chain-services service with services being a javascript array with objects', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: 'https://$host/api/turbosite/chain/chain-services',
            postParameters: {
                services: [{ "uri": "api/site/example/example-service-without-params" }]
            },
            contains: ['["Any value can be output by the service as a string (json or xml data, plain text, etc..)"]']
        }], (responses) => { done() });
    });
    
    
    it('should return the result of two services: ExampleServiceWithoutParams and ExampleServiceWithGetParams if executed via the chain-services service', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: 'https://$host/api/turbosite/chain/chain-services',
            postParameters: {
                services: [{ "uri": "api/site/example/example-service-without-params" },
                           { "uri": "api/site/example/example-service-with-get-params", "getParameters": ["1", "2"] }]
            },
            contains: ['Any value can be output by the service as a string (json or xml data, plain text, etc..)',
                       'this object is returned as a json string with the received GET parameters values',
                       '"received-param-0-value":"1"',
                       '"received-param-1-value":"2"']
        }], (responses) => { done() });
    });
    
    
    it('should return the result of three services: ExampleServiceWithoutParams, ExampleServiceWithGetParams and ExampleServiceWithPostParams if executed via the chain-services service', function(done) {
    
        httpTestsManager.assertHttpRequests([{
            url: 'https://$host/api/turbosite/chain/chain-services',
            postParameters: {
                services: [{ "uri": "api/site/example/example-service-without-params" },
                           { "uri": "api/site/example/example-service-with-get-params", "getParameters": ["1", "2"] },
                           { "uri": "api/site/example/example-service-with-post-params", "postParameters": {"param1": 1, "param2": 2} }]
            },
            contains: ['Any value can be output by the service as a string (json or xml data, plain text, etc..)',
                       'this object is returned as a json string with the received GET parameters values',
                       '"received-param-0-value":"1"',
                       '"received-param-1-value":"2"',
                       'this object is returned as a json string with the received POST parameters',
                       '"received-param1":"1"',
                       '"received-param2":"2"']
        }], (responses) => { done() });
    });
    
    
    it('should fail with 500 error if chain-services is called without post parameters', function(done) {
    
        httpTestsManager.assertUrlsFail([{
            url: 'https://$host/api/turbosite/chain/chain-services',
            responseCode: 500,
            contains: ['"code":500', 'Missing mandatory POST parameter: services'],
            notContains: ['turbosite-global-error-manager-problem']
        }], done);
    });
});