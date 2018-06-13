<?php

use org\turbosite\src\main\php\model\WebSite;

$ws = WebSite::getInstance();

$ws->initializeSingleParameterView('en', ['some parameter', 'testparameter']);

$ws->metaTitle = $ws->getParam();
$ws->metaDescription = $ws->getParam();

?>
<!doctype html>
<html lang="<?php echo $ws->getPrimaryLanguage() ?>">

<head>
    <?php $ws->echoHeadHtml() ?>
</head>

<body>

    <?php $ws->includeComponent('view/components/main-menu/main-menu') ?>

    <main>

        <section>

            <h1><?php echo 'This is the single parameter view' ?></h1>

            <h4><?php echo 'You passed the following parameter value: '.$ws->getParam() ?></h4>

            <p><?php echo 'Use it to process data when only one parameter is enough. The only parameter restriction is to be more than 2 digits in length' ?></p>

        </section>

    </main>

    <?php $ws->includeComponent('view/components/footer/footer') ?>

    <?php $ws->echoJavaScriptTags() ?>

</body>

</html>