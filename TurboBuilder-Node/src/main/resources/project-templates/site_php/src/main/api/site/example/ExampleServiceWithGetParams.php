<?php

namespace project\src\main\api\site\example;

use org\turbosite\src\main\php\model\WebService;


/**
 * An example of a service that must be called with get parameters
 */
class ExampleServiceWithGetParams extends WebService{


    protected function setup(){

        $this->enabledGetParams = 2;
    }


    public function run(){

        return [
            "info" => "this object is returned as a json string with the received GET parameters values",
            "received-param-0-value" => $this->getParam(0),
            "received-param-1-value" => $this->getParam(1)
        ];
    }
}

?>