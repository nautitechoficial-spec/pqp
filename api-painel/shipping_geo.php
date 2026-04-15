<?php
if (!function_exists('mbg_digits_only')) {
  function mbg_digits_only(?string $value): string {
    return preg_replace('/\D+/', '', (string)$value);
  }

  function mbg_format_cep(?string $value): string {
    $digits = mbg_digits_only($value);
    if (strlen($digits) !== 8) return $digits;
    return substr($digits, 0, 5) . '-' . substr($digits, 5, 3);
  }

  function mbg_http_json(string $url, string $method = 'GET', ?array $payload = null, array $headers = []): array {
    $ch = curl_init($url);
    $finalHeaders = array_merge([
      'Accept: application/json',
      'User-Agent: MinhaBagg/1.0 (frete)' 
    ], $headers);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => strtoupper($method),
      CURLOPT_HTTPHEADER => $finalHeaders,
      CURLOPT_TIMEOUT => 20,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    if ($payload !== null && strtoupper($method) !== 'GET') {
      $finalHeaders[] = 'Content-Type: application/json';
      curl_setopt($ch, CURLOPT_HTTPHEADER, $finalHeaders);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $json = json_decode((string)$raw, true);
    return ['ok' => !$err && $status >= 200 && $status < 300, 'status' => $status, 'data' => $json, 'raw' => $raw, 'error' => $err ?: ''];
  }

  function mbg_lookup_cep(string $cep): array {
    $digits = mbg_digits_only($cep);
    if (strlen($digits) !== 8) return ['ok' => false, 'error' => 'CEP deve ter 8 dígitos.'];
    $res = mbg_http_json('https://viacep.com.br/ws/' . $digits . '/json/');
    $data = is_array($res['data']) ? $res['data'] : [];
    if (!$res['ok'] || !empty($data['erro'])) {
      return ['ok' => false, 'error' => 'CEP não encontrado.'];
    }
    return [
      'ok' => true,
      'data' => [
        'cep' => mbg_format_cep($digits),
        'street' => (string)($data['logradouro'] ?? ''),
        'complement' => (string)($data['complemento'] ?? ''),
        'neighborhood' => (string)($data['bairro'] ?? ''),
        'city' => (string)($data['localidade'] ?? ''),
        'state' => strtoupper((string)($data['uf'] ?? '')),
        'ibge' => (string)($data['ibge'] ?? ''),
      ]
    ];
  }

  function mbg_geocode_cep(string $cep, ?string $city = null, ?string $state = null): array {
    $digits = mbg_digits_only($cep);
    if (strlen($digits) !== 8) return ['ok' => false, 'error' => 'CEP inválido.'];
    $query = $digits . ', Brazil';
    if ($city) $query = $digits . ', ' . $city . ', ' . $state . ', Brazil';
    $url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&postalcode=' . urlencode($digits);
    if ($city) $url .= '&city=' . urlencode($city);
    if ($state) $url .= '&state=' . urlencode($state);
    $res = mbg_http_json($url);
    $rows = is_array($res['data']) ? $res['data'] : [];
    if (!$res['ok'] || !$rows || !isset($rows[0]['lat'], $rows[0]['lon'])) {
      $fallbackUrl = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=' . urlencode($query);
      $res = mbg_http_json($fallbackUrl);
      $rows = is_array($res['data']) ? $res['data'] : [];
      if (!$res['ok'] || !$rows || !isset($rows[0]['lat'], $rows[0]['lon'])) {
        return ['ok' => false, 'error' => 'Não foi possível localizar esse CEP no mapa.'];
      }
    }
    return ['ok' => true, 'data' => ['lat' => (float)$rows[0]['lat'], 'lng' => (float)$rows[0]['lon']]];
  }

  function mbg_haversine_km(float $lat1, float $lng1, float $lat2, float $lng2): float {
    $earth = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earth * $c;
  }
}
