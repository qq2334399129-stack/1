<?php
declare(strict_types=1);
ini_set("display_errors", "0");

const SIGNATURE = "<?php http_response_code(404); exit; __halt_compiler();\n";
const MEDIA_ID = '/\A[0-9a-f]{32}\.(?:jpg|png|webp|gif|mp4|webm|bin)\z/';
const MIME = ['jpg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp','gif'=>'image/gif','mp4'=>'video/mp4','webm'=>'video/webm','bin'=>'application/octet-stream'];

final class Failure extends RuntimeException {}
function reject(int $status, string $message): never { throw new Failure($message, $status); }
function respond(array $value, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function storage(): string {
    return getenv('XIAOYE_DATA_DIR') ?: __DIR__ . '/.xiaoye-data';
}
function prepareStorage(): void {
    $dir = storage();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        reject(503, '数据目录无法创建。请在宝塔确认网站目录可由 PHP 运行用户写入。');
    }
    if (!is_writable($dir)) reject(503, '数据目录不可写。请检查网站目录权限。');
    if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\n", LOCK_EX);
}
function readProtected(string $name, mixed $fallback = null): mixed {
    $file = storage() . '/' . $name . '.php';
    if (!is_file($file)) return $fallback;
    $data = file_get_contents($file);
    if ($data === false || !str_starts_with($data, SIGNATURE)) reject(500, '存储数据无法读取。');
    return json_decode(substr($data, strlen(SIGNATURE)), true, 512, JSON_THROW_ON_ERROR);
}
function saveProtected(string $name, mixed $value): void {
    $path = storage() . '/' . $name . '.php';
    $temp = storage() . '/' . bin2hex(random_bytes(16)) . '.php';
    $data = SIGNATURE . json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    try {
        if (@file_put_contents($temp, $data, LOCK_EX) !== strlen($data) || !@rename($temp, $path)) {
            reject(503, '写入数据失败，请检查磁盘空间与目录权限。');
        }
        @chmod($path, 0600);
    } finally {
        if (is_file($temp)) @unlink($temp);
    }
}
function inLock(callable $callback): mixed {
    prepareStorage();
    $lock = @fopen(storage() . '/write-lock.php', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) reject(503, '无法锁定数据，请重试。');
    try { return $callback(); }
    finally { fclose($lock); }
}
function siteState(): array {
    $saved = readProtected('content');
    if ($saved) return $saved;
    return ['version'=>0, 'content'=>json_decode(file_get_contents(__DIR__.'/defaults.json'), true, 512, JSON_THROW_ON_ERROR)];
}
function body(): array {
    $data = file_get_contents('php://input', false, null, 0, 1_048_577);
    if ($data === false || strlen($data) > 1_048_576) reject(413, '请求内容过长。');
    $value = json_decode($data, true);
    if (!is_array($value)) reject(400, '无法读取请求内容。');
    return $value;
}
function startSession(): void {
    session_name('xiaoye_admin');
    $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    ini_set('session.use_strict_mode', '1');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
    if (!@session_start()) reject(503, '无法建立登录会话，请检查 PHP 会话目录。');
}
function authenticate(bool $write = false): array {
    if (!isset($_COOKIE["xiaoye_admin"])) reject(401, "请先登录。");
    startSession();
    $csrf = $_SESSION['csrf'] ?? '';
    if (!$csrf || ($_SESSION['until'] ?? 0) < time()) reject(401, '请先登录。');
    if ($write && !hash_equals($csrf, (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) reject(403, '会话验证失败，请刷新后台。');
    session_write_close();
    return ['csrf'=>$csrf];
}
function hasSession(): bool {
    if (!isset($_COOKIE['xiaoye_admin'])) return false;
    startSession();
    $active = (bool)($_SESSION['csrf'] ?? false) && ($_SESSION['until'] ?? 0) >= time();
    session_write_close();
    return $active;
}
function loginSession(): void {
    startSession();
    session_regenerate_id(true);
    $_SESSION = ['csrf'=>bin2hex(random_bytes(24)), 'until'=>time()+8*3600];
    session_write_close();
}
function setupPending(): bool {
    if (readProtected('admin')) return false;
    return inLock(function () {
        if (readProtected('admin')) return false;
        if (!readProtected('install-key')) saveProtected('install-key', ['code'=>bin2hex(random_bytes(16))]);
        return true;
    });
}
function initialize(): never {
    headerCheck();
    $values = body();
    inLock(function () use ($values) {
        if (readProtected('admin')) reject(409, '后台已初始化，请刷新页面登录。');
        $key = readProtected('install-key');
        $given = is_string($values['code'] ?? null) ? trim($values['code']) : '';
        if (!$key || !hash_equals($key['code'], $given)) reject(401, '安装码不正确，请从宝塔文件管理器查看。');
        $password = $values['password'] ?? '';
        if (!is_string($password) || strlen($password) < 12 || strlen($password) > 72) reject(400, '密码长度需为 12 到 72 字节，建议使用至少 12 位字母、数字和符号。');
        saveProtected('admin',['hash'=>password_hash($password,PASSWORD_DEFAULT)]);
        @unlink(storage().'/install-key.php');
    });
    loginSession();
    respond(['ok'=>true]);
}
function headerCheck(): void {
    if (($_SERVER['HTTP_X_ADMIN_REQUEST'] ?? '') !== '1') reject(403, '请通过后台页面提交。');
}
function logIn(): never {
    headerCheck();
    $input = body();
    $admin = readProtected('admin');
    if (!$admin) reject(409, '请先完成后台初始化。');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'local';
    $id = 'rate-' . substr(hash('sha256', $ip), 0, 20);
    inLock(function () use ($id, $input, $admin) {
        $attempt = readProtected($id, ['until'=>0,'count'=>0]);
        if (($attempt['until'] ?? 0) <= time()) $attempt = ['until'=>time()+600, 'count'=>0];
        if ($attempt['count'] >= 12) reject(429, '尝试次数过多，请稍后重试。');
        $password = $input['password'] ?? '';
        if (($input['username'] ?? '') !== 'admin' || !is_string($password) || strlen($password) > 72 || !password_verify($password,$admin['hash'])) {
            $attempt['count']++;
            saveProtected($id,$attempt);
            reject(401, '用户名或密码有误。');
        }
        @unlink(storage().'/'.$id.'.php');
    });
    loginSession();
    respond(['ok'=>true]);
}
function strValue(mixed $value, int $max = 160): string {
    if ($value === null) return '';
    if (!is_string($value) || strlen($value) > $max*4) reject(400, '字段格式错误或内容过长。');
    return trim($value);
}
function urlValue(mixed $value, array $schemes = ['https']): string {
    $value = strValue($value,2048);
    if ($value === '') return '';
    $parsed = parse_url($value);
    if (!$parsed || !in_array($parsed['scheme'] ?? '',$schemes,true) || empty($parsed['host']) ||
        isset($parsed['user']) || preg_match('/[\x00-\x20\\\\]/',$value)) reject(400, '链接无效，请使用 HTTPS 或官方 App 分享链接。');
    return $value;
}
function mediaId(string $value): string {
    $prefix = '/xiaoye-api.php?action=media&id=';
    if (!str_starts_with($value,$prefix)) return '';
    $id = substr($value,strlen($prefix));
    return preg_match(MEDIA_ID,$id) ? $id : '';
}
function mediaValue(mixed $value, string $kind): string {
    $value = strValue($value,160);
    if ($value === '') return '';
    $builtIns = ['assets/mark.svg','assets/ridge.webp','assets/red.webp','assets/red-study.mp4','assets/moss.webp'];
    $id = mediaId($value);
    if (!$id && !in_array($value,$builtIns,true)) reject(400, '媒体文件无效。');
    if ($id && !is_file(storage().'/'.$id.'.php')) reject(400, '媒体文件不存在，请重新上传。');
    $ext = pathinfo($id ?: $value,PATHINFO_EXTENSION);
    $types = ['image'=>['jpg','png','webp','gif','svg'],'video'=>['mp4','webm'],'file'=>['bin']];
    if (!in_array($ext,$types[$kind],true)) reject(400, '文件类型不匹配。');
    return $value;
}
function collection(mixed $rows, array $fields, array $required): array {
    if (!is_array($rows) || !array_is_list($rows) || count($rows) > 80) reject(400, '每类最多 80 项。');
    return array_map(function ($row) use ($fields,$required) {
        if (!is_array($row)) reject(400,'内容格式不正确。');
        $result = [];
        foreach ($fields as $field=>$parser) $result[$field] = $parser($row[$field] ?? null);
        foreach ($required as $field) if ($result[$field] === '') reject(400,'请填写标题并上传必要文件。');
        return $result;
    },$rows);
}
function normalize(array $input): array {
    $data = [];
    foreach (['name','topic','heroAlt','subscriptionLabel','videoTitle','skuTitle','assetTitle','toolsTitle'] as $key) $data[$key] = strValue($input[$key] ?? null);
    foreach (['intro','services','skillText','skuIntro','assetIntro'] as $key) $data[$key] = strValue($input[$key] ?? null,2500);
    foreach (['name','videoTitle','skuTitle','assetTitle','toolsTitle'] as $key) if ($data[$key] === '') reject(400,'请填写站名和区块标题。');
    $image = fn($value)=>mediaValue($value,'image');
    $desc = fn($value)=>strValue($value,2500);
    $file = fn($value)=>mediaValue($value,'file');
    $url = fn($value)=>urlValue($value);
    $data['avatar'] = $image($input['avatar'] ?? null);
    $data['hero'] = $image($input['hero'] ?? null);
    $data['subscriptionUrl'] = $url($input['subscriptionUrl'] ?? null);
    $contact = $input['contact'] ?? [];
    $email = strValue($contact['email'] ?? null,254);
    if ($email && !filter_var($email,FILTER_VALIDATE_EMAIL)) reject(400,'邮箱地址格式不正确。');
    $data['contact'] = [
        'email'=>$email,'qqUrl'=>urlValue($contact['qqUrl'] ?? null,['https','mqqapi','mqqwpa']),
        'wechatUrl'=>urlValue($contact['wechatUrl'] ?? null,['https','weixin']),
        'qqQr'=>$image($contact['qqQr'] ?? null),'wechatQr'=>$image($contact['wechatQr'] ?? null)
    ];
    $data['videos'] = collection($input['videos'] ?? [],['title'=>'strValue','category'=>'strValue','description'=>$desc,'cover'=>$image,'video'=>fn($v)=>mediaValue($v,'video')],['title','video']);
    $data['sku'] = collection($input['sku'] ?? [],['title'=>'strValue','code'=>'strValue','description'=>$desc,'image'=>$image,'link'=>$url],['title']);
    $data['assets'] = collection($input['assets'] ?? [],['title'=>'strValue','category'=>'strValue','description'=>$desc,'image'=>$image,'prompt'=>$desc,'file'=>$file,'fileName'=>'strValue'],['title']);
    $data['tools'] = collection($input['tools'] ?? [],['title'=>'strValue','description'=>$desc,'file'=>$file,'fileName'=>'strValue','access'=>fn($v)=>$v === 'public' ? 'public' : 'contact'],['title']);
    return $data;
}
function publicContent(): array {
    $data = siteState()['content'];
    foreach ($data['tools'] as &$tool) if ($tool['access'] !== 'public') { $tool['file'] = ''; $tool['fileName'] = ''; }
    return $data;
}
function publicMedia(string $id): bool {
    $data = publicContent();
    $refs = [$data['avatar'],$data['hero'],$data['contact']['qqQr'],$data['contact']['wechatQr']];
    foreach (['videos'=>['cover','video'],'sku'=>['image'],'assets'=>['image','file'],'tools'=>['file']] as $group=>$keys) {
        foreach ($data[$group] as $row) foreach ($keys as $key) $refs[] = $row[$key] ?? '';
    }
    foreach ($refs as $ref) if ($id === mediaId((string)$ref)) return true;
    return false;
}
function extension(string $bytes): string {
    return match (true) {
        str_starts_with($bytes,"\xff\xd8\xff")=>'jpg',
        str_starts_with($bytes,"\x89PNG\r\n\x1a\n")=>'png',
        str_starts_with($bytes,'RIFF') && substr($bytes,8,4)==='WEBP'=>'webp',
        str_starts_with($bytes,'GIF87a') || str_starts_with($bytes,'GIF89a')=>'gif',
        substr($bytes,4,4)==='ftyp'=>'mp4',
        str_starts_with($bytes,"\x1a\x45\xdf\xa3")=>'webm',
        default=>''
    };
}
function upload(): never {
    authenticate(true);
    prepareStorage();
    $kind = $_GET['kind'] ?? '';
    $formats = ['image'=>['jpg','png','webp','gif'],'video'=>['mp4','webm'],'file'=>['bin']];
    $limits = ['image'=>16,'video'=>512,'file'=>256];
    if (!is_string($kind) || !isset($limits[$kind])) reject(400,'上传类型无效。');
    $limit = $limits[$kind] * 1048576;
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $limit) reject(413,'文件太大。');
    $source = fopen('php://input','rb');
    if (!$source) reject(400,'无法读取上传文件。');
    $head = fread($source,16);
    if ($head === false || $head === '') reject(400,'文件为空。');
    $ext = $kind === 'file' ? 'bin' : extension($head);
    if (!in_array($ext,$formats[$kind],true)) reject(400,'不支持此文件格式，请检查图片或视频类型。');
    $id = bin2hex(random_bytes(16)) . '.' . $ext;
    $tmp = storage().'/upload-'.bin2hex(random_bytes(16)).'.php';
    $out = @fopen($tmp,'xb');
    if (!$out) reject(503,'无法创建文件。');
    @chmod($tmp,0600);
    try {
        $prefix = SIGNATURE.$head;
        if (fwrite($out,$prefix) !== strlen($prefix)) reject(503,'写入文件失败。');
        $rest = stream_copy_to_stream($source,$out,$limit-strlen($head)+1);
        if ($rest === false || !fflush($out)) reject(503,'写入文件失败。');
        if ($rest+strlen($head) > $limit) reject(413,'文件太大。');
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $rest+strlen($head)) reject(400,'上传中断，请重试。');
        fclose($out);
        if (!@rename($tmp,storage().'/'.$id.'.php')) reject(503,'无法保存文件。');
    } finally {
        fclose($source);
        if (is_resource($out)) fclose($out);
        if (is_file($tmp)) @unlink($tmp);
    }
    respond(['url'=>'/xiaoye-api.php?action=media&id='.$id],201);
}
function serveMedia(): never {
    $id = $_GET['id'] ?? '';
    if (!is_string($id) || !preg_match(MEDIA_ID,$id) || (!publicMedia($id) && !hasSession())) reject(404,'文件不存在。');
    $filepath = storage().'/'.$id.'.php';
    if (!is_file($filepath)) reject(404,'文件不存在。');
    $file = fopen($filepath,'rb');
    if (!$file || fread($file,strlen(SIGNATURE)) !== SIGNATURE) reject(404,'文件不存在。');
    $size = filesize($filepath) - strlen(SIGNATURE);
    $start = 0;
    $end = $size - 1;
    $ext = pathinfo($id,PATHINFO_EXTENSION);
    header('Content-Type: '.MIME[$ext]);
    header('Cache-Control: private, no-cache');
    header('Accept-Ranges: bytes');
    if ($ext === 'bin') {
        $name = $_GET['name'] ?? 'download';
        if (!is_string($name) || $name === '') $name = 'download';
        $name = substr(str_replace(["\r","\n","\0",'/',chr(92)],'_',$name),0,240);
        header("Content-Disposition: attachment; filename=\"download\"; filename*=UTF-8''".rawurlencode($name));
    }
    $range = $_SERVER['HTTP_RANGE'] ?? '';
    if ($size > 0 && preg_match('/^bytes=(\d*)-(\d*)$/',$range,$parts) && ($parts[1] !== '' || $parts[2] !== '')) {
        if ($parts[1] === '') $start = max(0,$size-(int)$parts[2]);
        else { $start = (int)$parts[1]; if ($parts[2] !== '') $end = min($end,(int)$parts[2]); }
        if ($start >= $size || $end < $start) { http_response_code(416); header('Content-Range: bytes */'.$size); exit; }
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
    }
    $length = max(0,$end-$start+1);
    header('Content-Length: '.$length);
    if ($_SERVER['REQUEST_METHOD'] !== 'HEAD' && $length > 0) {
        fseek($file,strlen(SIGNATURE)+$start);
        stream_copy_to_stream($file,fopen('php://output','wb'),$length);
    }
    fclose($file);
    exit;
}

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
try {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    if ($action === 'health' && $method === 'GET') respond(['service'=>'xiaoye-portfolio-php','setup'=>setupPending()]);
    if ($action === 'content' && $method === 'GET') respond(publicContent());
    if ($action === 'setup' && $method === 'POST') initialize();
    if ($action === 'login' && $method === 'POST') logIn();
    if ($action === 'logout' && $method === 'POST') {
        authenticate(true);
        startSession();
        $_SESSION = [];
        session_destroy();
        respond(['ok'=>true]);
    }
    if ($action === 'admin' && $method === 'GET') respond(siteState()+authenticate());
    if ($action === 'admin' && $method === 'PUT') {
        authenticate(true);
        $payload = body();
        $result = inLock(function () use ($payload) {
            $now = siteState();
            if (($payload['version'] ?? null) !== $now['version']) reject(409,'内容已被其他窗口更新，请刷新后再编辑。');
            $data = $payload['content'] ?? null;
            if (!is_array($data)) reject(400,'内容格式错误。');
            $next = ['version'=>$now['version']+1,'content'=>normalize($data)];
            saveProtected('content',$next);
            return $next;
        });
        respond($result);
    }
    if ($action === 'upload' && $method === 'PUT') upload();
    if ($action === 'media' && in_array($method,['GET','HEAD'],true)) serveMedia();
    reject(404,'页面不存在。');
} catch (Failure $error) {
    respond(['error'=>$error->getMessage()],$error->getCode());
} catch (Throwable $error) {
    error_log($error->getMessage());
    respond(['error'=>'服务器暂时无法处理请求。'],500);
}
