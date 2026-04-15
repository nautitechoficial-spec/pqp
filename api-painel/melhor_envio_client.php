<?php
if (!function_exists('mbg_me_env_base_url')) {
  function mbg_me_env_base_url(string $environment = 'sandbox'): string {
    return strtolower(trim($environment)) === 'production'
      ? 'https://www.melhorenvio.com.br'
      : 'https://sandbox.melhorenvio.com.br';
  }

  function mbg_me_normalize_phone(?string $value): string {
    return preg_replace('/\D+/', '', (string)$value);
  }

  function mbg_me_digits(?string $value): string {
    return preg_replace('/\D+/', '', (string)$value);
  }

  function mbg_me_only_numbers(?string $value): string {
    return preg_replace('/\D+/', '', (string)$value);
  }

  function mbg_me_request(string $environment, string $token, string $method, string $path, ?array $payload = null): array {
    $token = trim($token);
    if ($token === '') {
      return ['ok' => false, 'status' => 0, 'error' => 'Token do Melhor Envio não configurado.'];
    }

    $url = rtrim(mbg_me_env_base_url($environment), '/') . $path;
    $ch = curl_init($url);
    $headers = [
      'Accept: application/json',
      'Content-Type: application/json',
      'Authorization: Bearer ' . $token,
      'User-Agent: MinhaBagg/1.0 (suporte@minhabagg.com.br)'
    ];

    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => strtoupper($method),
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_TIMEOUT => 45,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    if ($payload !== null && strtoupper($method) !== 'GET') {
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    $raw = curl_exec($ch);
    $curlErr = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $json = json_decode((string)$raw, true);
    $error = '';
    if ($curlErr) $error = $curlErr;
    elseif ($status >= 400) {
      $error = $json['message'] ?? $json['error'] ?? '';
      if (!$error && !empty($json['errors']) && is_array($json['errors'])) {
        $parts = [];
        foreach ($json['errors'] as $k => $v) {
          if (is_array($v)) $parts[] = $k . ': ' . implode(' | ', array_map('strval', $v));
          else $parts[] = is_string($k) ? ($k . ': ' . (string)$v) : (string)$v;
        }
        $error = implode(' / ', $parts);
      }
      if (!$error) $error = 'Erro HTTP ' . $status . ' no Melhor Envio.';
    }

    return [
      'ok' => !$curlErr && $status >= 200 && $status < 300,
      'status' => $status,
      'data' => $json,
      'raw' => $raw,
      'error' => $error,
    ];
  }

  function mbg_me_service_name(array $row): string {
    $company = $row['company']['name'] ?? '';
    $name = $row['name'] ?? $row['service_name'] ?? '';
    return trim($company !== '' ? ($company . ' - ' . $name) : $name);
  }

  function mbg_me_service_slug(array $row): string {
    $name = strtolower(mbg_me_service_name($row));
    $name = str_replace(['á','à','â','ã','é','ê','í','ó','ô','õ','ú','ç'], ['a','a','a','a','e','e','i','o','o','o','u','c'], $name);
    return preg_replace('/[^a-z0-9]+/', '_', $name);
  }

  function mbg_me_extract_protocol(array $data): ?string {
    foreach (['protocol','tracking','tracking_code','trackingNumber'] as $k) {
      if (!empty($data[$k])) return (string)$data[$k];
    }
    if (!empty($data['tracking_info']['tracking'])) return (string)$data['tracking_info']['tracking'];
    return null;
  }
}
