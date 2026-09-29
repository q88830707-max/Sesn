<?php
error_reporting(0);
header("Content-Type: application/json; charset=utf-8");

$adres = isset($_GET["adres"]) ? $_GET["adres"] : "";

if (strlen($adres) < 3) {
    echo json_encode([
        "info" => "t.me/arastirvip_bot",
        "data" => "t.me/arastirvip_bot"
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$token = "pk.eyJ1IjoiZGVtY2JuIiwiYSI6ImNtdWswbWt2cjB0Z2IyeXIyM2liYW4wbzEifQ.EqlsGjFhQWgzkksmxGwl-w";

// 1) Adresi koordinata çevir (Mapbox Geocoding)
$geo_url = "https://api.mapbox.com/geocoding/v5/mapbox.places/"
         . rawurlencode($adres) . ".json"
         . "?limit=1&language=tr&access_token=" . $token;

$geo_resp = @file_get_contents($geo_url);
$geo = json_decode($geo_resp, true);

if (!isset($geo["features"][0]["center"][0])) {
    echo json_encode([
        "info" => "t.me/arastirvip_bot",
        "data" => "t.me/arastirvip_bot"
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$lon = $geo["features"][0]["center"][0];
$lat = $geo["features"][0]["center"][1];

// 2) Statik harita fotoğrafını al
$map_url = "https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/"
         . $lon . "," . $lat . ",15/600x450"
         . "?access_token=" . $token;

$img = @file_get_contents($map_url);

if ($img === false || strlen($img) < 100) {
    echo json_encode([
        "info" => "t.me/arastirvip_bot",
        "data" => "t.me/arastirvip_bot"
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// 3) db/fotolar klasörüne kaydet
$dir = __DIR__ . "/db/fotolar";
if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
}

$dosya = "foto_" . date("Ymd_His") . "_" . bin2hex(random_bytes(4)) . ".png";
@file_put_contents($dir . "/" . $dosya, $img);

// 4) URL oluştur
$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host  = $_SERVER['HTTP_HOST'];
$path  = dirname($_SERVER['SCRIPT_NAME']);
$url   = $proto . "://" . $host . $path . "/db/fotolar/" . $dosya;

// 5) JSON döndür
echo json_encode([
    "info" => "t.me/arastirvip_bot",
    "data" => [
        "adres"    => $adres,
        "lon"      => $lon,
        "lat"      => $lat,
        "foto_url" => $url,
        "dosya"    => $dosya
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
