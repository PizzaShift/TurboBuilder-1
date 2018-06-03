<?php

use org\turbosite\src\main\php\model\WebSite;

$ws = WebSite::getInstance();
$ws->initializeView();
$ws->loadBundles(['home']);

?>

<!doctype html>
<html lang="<?php echo $ws->getPrimaryLanguage() ?>">

<head>
<?php
    $ws->echoHeadHtml(
    $ws->getLoc('TITLE', 'home'),
    $ws->getLoc('DESCRIPTION', 'home')) ?>
</head>

<body>

	<?php $ws->require('view/components/header/header.php') ?>


	<!-- Place HTML BODY contents here -->


	<?php $ws->require('view/components/footer/footer.php') ?>

</body>

</html>