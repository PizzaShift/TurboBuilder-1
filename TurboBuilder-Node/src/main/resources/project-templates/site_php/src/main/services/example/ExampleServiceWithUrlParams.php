<?php

namespace project\src\main\services\example;

use org\turbosite\src\main\php\model\WebService;


/**
 * An example of a service that must be called with get parameters
 */
class ExampleServiceWithUrlParams extends WebService{


    protected function setup(){

        $this->enabledUrlParams = 2;
    }


    public function run(){

        return [
            "info" => "this object is returned as a json string with the received URL parameters values",
            "received-param-0-value" => $this->getUrlParam(0),
            "received-param-1-value" => $this->getUrlParam(1)
        ];
    }
}

?>