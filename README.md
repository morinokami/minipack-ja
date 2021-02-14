## 📦 Minipack

> JavaScript によるモダンなモジュールバンドラーの簡易な例

### はじめに

フロントエンド開発者として、私たちは [webpack](https://github.com/webpack/webpack) や [Browserify](https://github.com/browserify/browserify)、[Parcel](https://github.com/parcel-bundler/parcel) といったツールの取り扱いに多くの時間を割いています。

これらのツールの仕組みを理解することにより、コードの書き方についてより良い決定ができるようになります。コードがどのようにバンドルとなり、バンドルがどのような見た目をしているかを理解することは、それをデバッグする際にも役立ちます。

このプロジェクトの目的は、多くのバンドラーが内部で何をしているのかを説明することです。プロジェクトには、単純化されてはいますが、十分に本物に近いバンドラーが含まれています。コードと並んで、そのコードが何をしようとしているかを説明するコメントが付記されています。

### 面白そう、何から始めればいいですか？

ソースコードをどうぞ: [src/minipack.js](src/minipack.js)

### コードを実行してみる

まず依存パッケージをインストールしましょう:

```sh
$ npm install
```

そしてスクリプトを実行します:

```sh
$ node src/minipack.js
```

### さらなるリンク

- [AST Explorer](https://astexplorer.net)
- [Babel REPL](https://babeljs.io/repl)
- [Babylon](https://github.com/babel/babel/tree/master/packages/babel-parser)
- [Babel Plugin Handbook](https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md)
- [Webpack: Modules](https://webpack.js.org/concepts/modules)

### 他の言語で読む

- [English/英語](https://github.com/ronami/minipack)
- [한글/韓国語](https://github.com/hg-pyun/minipack-kr)
- [中文/中国語](https://github.com/chinanf-boy/minipack-explain)
- [Русский/ロシア語](https://github.com/makewebme/build-your-own-webpack)

###  訳者注記

より良い理解の助けになると考え、もとのプロジェクトにいくつかのファイルを追加しました:

- コメントを削除したソースコード: [src/minipack-code-only.js](src/minipack-code-only.js)
- webpack によるバンドルの例: [bundle-webpack.js](bundle-webpack.js)
