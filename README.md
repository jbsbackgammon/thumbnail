# JBS YouTube サムネイル作成ツール

GitHub Pages上で動作する、JBSタイトル戦向け1920×1080pxサムネイル作成ツールです。

## 公開方法

1. このフォルダ一式をGitHubリポジトリの`main`ブランチへ配置します。
2. GitHubの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
3. `main`へpushすると `.github/workflows/pages.yml` が自動でPagesへ公開します。

## 選手を追加する方法

1. 512×512pxの選手写真を `assets/players/` に追加します。
2. `players.js` の `window.JBS_PLAYERS` に `id / name / roman / photo` を1件追加します。
3. pushすると自動反映されます。

## 画像出力

ブラウザ内のCanvasは常に1920×1080pxで描画し、「PNGをダウンロード」でそのままYouTubeサムネイル用PNGとして保存します。

## 決勝向け全面写真

「背景モード」を「全面写真」に変更し、背景写真をアップロードしてください。左右選手名・大会情報は通常通り選択できます。
