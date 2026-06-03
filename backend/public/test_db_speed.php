<?php
$t = microtime(true);
try {
    $pdo = new PDO("mysql:host=db;port=3306;dbname=prolecom", "root", "root");
    echo "Connected in " . (microtime(true) - $t) . " seconds";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . " in " . (microtime(true) - $t) . " seconds";
}
