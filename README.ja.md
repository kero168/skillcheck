# skillcheck

> Agent Skills（`SKILL.md`）の lint・検証・トークンコスト計測を行う CLI。完全ローカル動作、LLM も API キーも不要。

[![CI](https://github.com/kero168/skillcheck/actions/workflows/ci.yml/badge.svg)](https://github.com/kero168/skillcheck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

[English](README.md) | 日本語

Agent Skills は、`SKILL.md` を含むフォルダとして AI エージェントに手順を教える仕組みです。
description が曖昧なスキルは発火せず、参照先が壊れたスキルはツール呼び出しを無駄にし、
肥大化したスキルは静かにコンテキストウィンドウを食いつぶします。
**skillcheck** はこの 3 つを出荷前に検出します。CI で使える終了コードを返し、モデルは一切呼びません。

- **`skillcheck lint`** — frontmatter の必須項目（`name` / `description`）、name の形式、
  description の品質（長さとトリガー語）、壊れた相対リンク、存在しない参照ファイルを検証。
  すべてのルールに安定 ID（`S001`〜`S014`）が付きます。
- **`skillcheck tokens`** — 読み込み段階ごと（常時ロードされるメタデータ → 発火時に読む本文 →
  必要時に読む参照ファイル）の概算トークン数を、cl100k 近似のローカル実装で表示。
- **`skillcheck list`** — ディレクトリを走査してスキル一覧と健康状態の表を出力。
- **`skillcheck rules`** — ルール一覧（カタログ）を表示。

## インストール

```bash
npm install -g skillcheck            # グローバル CLI
npx skillcheck list .claude/skills   # その場で実行する場合
```

Node.js 20 以上が必要です。実行時依存は `commander` / `yaml` / `picocolors` のみです。

## 使い方

### スキルを lint する

```console
$ skillcheck lint fixtures/broken-links
fixtures/broken-links/SKILL.md
  error   S009 broken link "references/missing.md": file does not exist (line 8)
  warning S014 referenced file "scripts/does-not-exist.py" does not exist (line 10)

FAIL: 2 problems (1 error, 1 warning) in 1 skill file
```

終了コード: `0` 問題なし / `1` 検出あり / `2` 使い方・IO エラー。
`--strict` で warning も失敗扱いに、`--json` で CI 向けの機械可読出力になります。

### トークンコストを計測する

```console
$ skillcheck tokens fixtures/pdf-extractor
Token cost: fixtures/pdf-extractor/SKILL.md

TIER       FILE                                       BYTES  ~TOKENS
---------  -----------------------------------------  -----  -------
metadata   frontmatter metadata (name + description)  152    ~40
body       SKILL.md body                              462    ~129
reference  references/forms.md                        480    ~129
reference  scripts/extract.py                         1061   ~316

always in context  metadata: ~40 tokens (preloaded so the agent can pick skills)
loaded on trigger  SKILL.md body: ~129 tokens
loaded on demand   2 referenced files: ~445 tokens

total if fully loaded: ~614 tokens
```

3 つの段階は Agent Skills の段階的開示（progressive disclosure）モデルに対応します。
常時コンテキストに載るのはメタデータだけなので、そこを最小に保つのが重要です。

### ツリー内の全スキルを一覧する

```console
$ skillcheck list fixtures
STATUS  NAME           ERRORS  WARNINGS  ~TOKENS  PATH
------  -------------  ------  --------  -------  -------------------------------
fail    broken-links   1       1         ~42      fixtures/broken-links/SKILL.md
fail    (unnamed)      1       0         ~17      fixtures/broken-yaml/SKILL.md
ok      commit-helper  0       0         ~134     fixtures/commit-helper/SKILL.md
fail    (unnamed)      1       1         ~22      fixtures/missing-name/SKILL.md
ok      pdf-extractor  0       0         ~129     fixtures/pdf-extractor/SKILL.md

5 skills: 2 ok, 0 warn, 3 fail
```

## ルール

ルール ID は安定しており再利用されません。CI や `--json` の利用側で安心してピン留めできます。

| ID | 名前 | 重大度 | 検証内容 |
| --- | --- | --- | --- |
| S001 | missing-frontmatter | error | ファイルが `---` の YAML frontmatter で始まること |
| S002 | invalid-frontmatter-yaml | error | frontmatter が YAML マッピングとして解析できること |
| S003 | missing-name | error | 必須の `name` が空でない文字列であること |
| S004 | missing-description | error | 必須の `description` が空でない文字列であること |
| S005 | invalid-name-format | error | `name` が小文字・数字・ハイフンのみで 64 文字以内 |
| S006 | description-too-short | warning | description が 20 文字以上あること |
| S007 | description-too-long | error | description が仕様上限の 1024 文字以内であること |
| S008 | no-trigger-phrase | warning | description に「いつ使うか」（Use when ... 等）があること |
| S009 | broken-link | error | 相対 Markdown リンクが実在ファイルを指すこと |
| S010 | name-directory-mismatch | warning | フォルダ名がスキル名と一致すること |
| S011 | unknown-frontmatter-field | warning | frontmatter が既知のフィールドのみ使うこと |
| S012 | body-too-large | warning | 本文が概算 5000 トークン以内であること |
| S013 | empty-body | warning | frontmatter の後に本文（指示）があること |
| S014 | missing-referenced-file | warning | インラインコード中のパスが実在すること |

`skillcheck rules`（または `skillcheck rules --json`）で同じカタログを CLI から確認できます。
ルールの追加方法は [ARCHITECTURE.md](ARCHITECTURE.md) を参照してください。

## 仕様準拠について

skillcheck は Claude Code / Claude Agent SDK および
[anthropics/skills](https://github.com/anthropics/skills) で使われている
[Agent Skills](https://code.claude.com/docs/en/skills) 形式を検証します。
`SKILL.md` の YAML frontmatter に `name`（小文字・数字・ハイフン、最大 64 文字）と
`description`（最大 1024 文字）を持ち、`license` / `allowed-tools` / `metadata` を
任意で持てる、という形式です。構造的な制限（S005・S007・S011)は仕様に従い、
品質ルール（S006・S008・S012）は公開されている執筆ガイダンスを warning として符号化したものです。

### AGENTS.md について

[AGENTS.md](https://agents.md) は補完的な規約です。多くのコーディングエージェントが
毎回読むリポジトリ単位の指示書であるのに対し、スキルは必要時にロードされる再利用可能な
能力です。現在の skillcheck が lint するのは `SKILL.md` のみですが、AGENTS.md も同じ
コンテキスト予算を消費するため、`tokens` と `lint` の一部を AGENTS.md に拡張することを
[ロードマップ](ROADMAP.md)に載せています。

## トークン概算の正直な話

`skillcheck tokens` は `cl100k_base` のプリトークナイザを模した小さなローカル近似
（[`src/tokenizer.ts`](src/tokenizer.ts)）を使います。ネットワーク接続もモデルの
ダウンロードも不要です。ただしあくまで**概算**であり、正確な値はトークナイザとモデルに
より異なります。スキル間の比較や肥大化の検出に使い、課金計算には使わないでください。
正確な値が必要な場合は、`--json` 出力のファイル一覧に対して各プロバイダのトークナイザを
実行してください。

## プログラムからの利用

CLI の全機能はライブラリとしても公開されています。

```ts
import { parseSkillFile, runRules, estimateTokens, discoverSkills } from "skillcheck";

const skill = parseSkillFile(".claude/skills/pdf-extractor/SKILL.md");
const findings = runRules(skill); // ruleId / severity / message / line を持つ Finding[]
const cost = estimateTokens(skill.body);
```

## 開発

```bash
git clone https://github.com/kero168/skillcheck.git
cd skillcheck
npm install
npm run build       # tsup -> dist/
npm test            # vitest（fixtures/ のスキルをテストコーパスとして使用）
npm run typecheck   # tsc --noEmit
node dist/cli.js list fixtures
```

[`fixtures/`](fixtures/) の 5 スキル（正常 2 + 意図的に壊した 3）はテストコーパスであると
同時に、各ルールが何を検出するかの生きたドキュメントです。

[CONTRIBUTING.md](CONTRIBUTING.md)・[docs/quickstart.md](docs/quickstart.md)・
[ARCHITECTURE.md](ARCHITECTURE.md) も参照してください。

## ライセンス

[MIT](LICENSE) © kero168
