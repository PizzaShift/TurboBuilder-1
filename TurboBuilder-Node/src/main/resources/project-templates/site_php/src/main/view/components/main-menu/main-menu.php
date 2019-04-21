<?php

use org\turbosite\src\main\php\managers\WebSiteManager;

$ws = WebSiteManager::getInstance();

$ws->loadBundles('resources', ['main-menu']);

?>

<nav>

    <section>

        <p><?php $ws->echoLoc('TITLE')?></p>

        <a href="<?php $ws->echoUrlToView($ws->getHomeView()) ?>">
            <?php $ws->echoLoc('HOME')?></a>

        <a href="<?php $ws->echoUrlToView($ws->getSingleParameterView(), 'test parameter 1') ?>">
            <?php $ws->echoLoc('SINGLE_PARAM')?></a>

        <a href="<?php $ws->echoUrlToView('multi-parameters', ['parameter 1', 'parameter 2', 'parameter 3']) ?>">
            <?php $ws->echoLoc('MULTI_PARAM')?></a>

    </section>

</nav>

