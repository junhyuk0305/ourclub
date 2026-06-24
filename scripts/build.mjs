// 프로덕션 빌드 런처 — Node 버전에 따라 빌드 실행 주체를 분기한다.
//
// 배경: 이 앱(약 3,200 모듈)을 Node 24+에서 빌드하면 rollup의 generate() 단계
// (모듈 실행순서 분석, 깊은 재귀)가 스레드 스택을 넘겨 Windows에서
// 0xC0000409(STATUS_STACK_BUFFER_OVERRUN)로 하드 크래시한다. 소스/rollup
// 버전과 무관한 Node 24 + 대형 그래프 조합 문제로, Node 20/22 LTS에서는 정상.
//
// 시스템 Node를 24로 유지(개발 편의)하면서 빌드만 통과시키기 위해,
// 프로젝트에 고정한 포터블 Node 22(`.local-node/node.exe`)로 빌드를 위임한다.
// 시스템 Node가 이미 22 이하면 위임 없이 현재 node로 바로 빌드한다.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const pinnedNode = path.join(root, '.local-node', 'node.exe');
const major = Number(process.versions.node.split('.')[0]);

let nodeBin = process.execPath;
if (major >= 23) {
  if (existsSync(pinnedNode)) {
    nodeBin = pinnedNode;
    console.log(`[build] Node ${process.versions.node} 감지 → 고정된 Node 22(.local-node)로 빌드 위임`);
  } else {
    console.error(
      `[build] 경고: 현재 Node ${process.versions.node}에서는 rollup이 크래시(0xC0000409)할 수 있고\n` +
      `        고정 Node(.local-node/node.exe)가 없습니다. Node 20/22 LTS로 빌드하세요.`
    );
  }
}

const r = spawnSync(nodeBin, [viteBin, 'build', ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: root,
});
process.exit(r.status ?? 1);
