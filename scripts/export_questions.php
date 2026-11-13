<?php
if ($argc < 3) {
    fwrite(STDERR, "Uso: php export_questions.php <ruta-a-sqlite-superate.db> <carpeta-del-aplicativo>\n");
    exit(2);
}
$dbPath = realpath($argv[1]);
$appRoot = $argv[2];
if (!$dbPath || !is_file($dbPath)) {
    fwrite(STDERR, "No se encontró la base de datos.\n");
    exit(2);
}
if (!is_dir($appRoot) && !mkdir($appRoot, 0777, true) && !is_dir($appRoot)) {
    fwrite(STDERR, "No se pudo preparar la carpeta del aplicativo.\n");
    exit(2);
}
$pdo = new PDO('sqlite:' . $dbPath, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('PRAGMA encoding = "UTF-8"');
$sourceRoot = dirname($dbPath);
$imageRoot = $sourceRoot . '/_/editor/images';
$out = [];
$rows = $pdo->query('SELECT t.id AS test_id, c.titulo AS grade_label, m.id AS module_id, m.id_areas AS area_id, a.area AS subject, m.titulo_cms AS group_title, m.texto AS context_html, q.id AS question_id, q.numero AS question_number, q.pregunta AS question_html FROM pruebas t JOIN cursos c ON c.id=t.id_cursos JOIN pruebas_modulos m ON m.id_pruebas=t.id JOIN areas a ON a.id=m.id_areas JOIN preguntas q ON q.id_pruebas_modulos=m.id ORDER BY t.id, m.id, CAST(q.numero AS INTEGER), q.id');
$choiceQuery = $pdo->prepare('SELECT respuesta FROM respuestas WHERE id_preguntas=? ORDER BY id');
$imageRefs = [];
$rewrite = static function ($html) use (&$imageRefs) {
    $html = $html === null ? '' : $html;
    $result = preg_replace_callback('~(?:src|href)=["\'](/_/editor/images/[^"\']+)["\']~i', static function ($m) use (&$imageRefs) {
        $urlPath = $m[1];
        $relative = rawurldecode(substr($urlPath, strlen('/_/editor/images/')));
        $imageRefs[$relative] = true;
        $local = './assets/images/' . implode('/', array_map('rawurlencode', explode('/', $relative)));
        return str_replace($urlPath, $local, $m[0]);
    }, $html);
    return $result === null ? $html : $result;
};
foreach ($rows as $row) {
    $grade = (int)preg_replace('/\D+/', '', $row['grade_label']);
    $subject = $row['subject'];
    if (!isset($out[$grade][$subject])) $out[$grade][$subject] = ['groups' => []];
    $key = (string)$row['module_id'];
    if (!isset($out[$grade][$subject]['groups'][$key])) {
        $out[$grade][$subject]['groups'][$key] = [
            'title' => trim(strip_tags(html_entity_decode((string)$row['group_title'], ENT_QUOTES | ENT_HTML5, 'UTF-8'))),
            'context' => $rewrite($row['context_html']),
            'questions' => [],
        ];
    }
    $choiceQuery->execute([$row['question_id']]);
    $choices = array_map(function ($r) use ($rewrite) { return $rewrite($r['respuesta']); }, $choiceQuery->fetchAll(PDO::FETCH_ASSOC));
    $out[$grade][$subject]['groups'][$key]['questions'][] = [
        'id' => (int)$row['question_id'],
        'number' => (int)$row['question_number'],
        'content' => $rewrite($row['question_html']),
        'options' => $choices,
    ];
}
foreach ($out as $grade => &$subjects) {
    foreach ($subjects as &$exam) {
        usort($exam['groups'], function ($a, $b) {
            $qa = isset($a['questions'][0]) ? $a['questions'][0] : array('number' => 0, 'id' => 0);
            $qb = isset($b['questions'][0]) ? $b['questions'][0] : array('number' => 0, 'id' => 0);
            if ((int)$qa['number'] === (int)$qb['number']) return (int)$qa['id'] - (int)$qb['id'];
            return (int)$qa['number'] - (int)$qb['number'];
        });
        $exam['groups'] = array_values($exam['groups']);
    }
}
unset($subjects, $exam);
$jsonPath = rtrim($appRoot, '/\\') . '/data/questions.json';
if (!is_dir(dirname($jsonPath))) mkdir(dirname($jsonPath), 0777, true);
file_put_contents($jsonPath, json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
$copied = 0;
foreach (array_keys($imageRefs) as $relative) {
    $from = $imageRoot . '/' . $relative;
    if (!is_file($from)) continue;
    $to = rtrim($appRoot, '/\\') . '/assets/images/' . $relative;
    if (!is_dir(dirname($to))) mkdir(dirname($to), 0777, true);
    if (copy($from, $to)) $copied++;
}
fwrite(STDOUT, 'Pruebas exportadas: ' . count($out) . ' grados; recursos de imagen: ' . $copied . "\n");
