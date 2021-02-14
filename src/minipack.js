/**
 * モジュールバンドラーは、小さなコード片を、ウェブブラウザで動作する、より
 * 大きく複雑なものへとコンパイルします。この小さなコード片とは JavaScript
 * ファイルのことであり、各ファイルの依存関係はモジュールシステムによって
 * 表現されます (https://webpack.js.org/concepts/modules)。
 *
 * モジュールバンドラーはエントリーファイルという概念をもちます。いくつかの
 * script タグをブラウザに追加してそれらを実行する代わりに、どれが
 * アプリケーションのメインファイルなのかをバンドラーに知らせるのです。
 * このファイルはアプリケーション全体を起動させるファイルです。
 *
 * 私たちのバンドラーは、エントリーファイルからスタートし、それが他のどの
 * ファイルに依存しているのかを確認します。続いて、その依存対象が依存している
 * ファイルを確認します。アプリケーションのすべてのモジュールが互いに
 * どのように依存しあっているのかを把握できるまで、上の工程を繰り返します。
 *
 * このようにして得られるプロジェクトの全体像は、依存グラフと呼ばれます。
 *
 * 以下の例では、私たちは依存グラフを作成し、それを用いてすべてのモジュールを
 * 一つのバンドルへとまとめ上げます。
 *
 * 始めましょう :)
 *
 * 注意点: これはとても簡略化された例です。できる限り例をシンプルに保つため、
 * 依存の循環への対処、エクスポートされるモジュールのキャッシュ、
 * 各モジュールを一度だけパースすること、等々は考慮されていません。
 */

const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const {transformFromAst} = require('babel-core');

let ID = 0;

// ファイルへのパスを受け取り、その中身を読み込み、依存対象を抜き出す関数を
// まず作成します。
function createAsset(filename) {
  // ファイルの中身を文字列として読み込みます。
  const content = fs.readFileSync(filename, 'utf-8');

  // ここで、このファイルが他のどのファイルに依存しているのかを確認します。
  // import という文字列を探すことでも可能ですが、これは少し不格好なため、
  // 代わりに JavaScript パーサーを使うことにします。
  //
  // JavaScript パーサーは、JavaScript のコードを読み込んで理解するための
  // ツールです。AST (抽象構文木) と呼ばれる、より抽象的なモデルを生成します。

  // AST の見た目を確認するために、AST Explorer (https://astexplorer.net) を
  // 見てみることを強くおすすめします。
  //
  // AST は、私たちのコードに関する多くの情報を含んでいます。AST に対し、
  // コードがおこなおうとしていることを問い合わせることができます。
  const ast = babylon.parse(content, {
    sourceType: 'module',
  });

  // この配列は、このモジュールが依存するモジュールの相対パスを格納します。
  const dependencies = [];

  // このモジュールが依存するモジュールを把握するために、AST を走査します。
  // そのために、AST に含まれるすべてのインポート宣言をチェックします。
  traverse(ast, {
    // EcmaScript モジュールは静的であるためとても簡単です。つまり、変数を
    // インポートしたり、条件に応じて他のモジュールをインポートすることはできません。
    // インポート文を見たら、その値が依存対象であると考えればよいのです。
    ImportDeclaration: ({node}) => {
      // インポートする値を、依存対象を格納する配列に追加します。
      dependencies.push(node.source.value);
    },
  });

  // シンプルなカウンターを増加させ、このモジュールにユニークな ID を割り当てます。
  const id = ID++;

  // 私たちは、EcmaScript モジュールや、すべてのブラウザではサポートされていない
  // JavaScript の他の機能を使用します。バンドルがすべてのブラウザで実行できる
  // ように、これを Babel によりトランスパイルします
  // (https://babeljs.io を確認してください)。
  //
  // `presets` オプションは、コードのトランスパイルの仕方を Babel に伝える
  // ルールのセットです。大方のブラウザが実行できるものへとコードを
  // トランスパイルするために、ここでは `babel-preset-env` を使用します。
  const {code} = transformFromAst(ast, null, {
    presets: ['env'],
  });

  // このモジュールに関するすべての情報を返します。
  return {
    id,
    filename,
    dependencies,
    code,
  };
}

// 一つのモジュールについて依存対象を抜き出せるようになったので、
// エントリーファイルの依存対象を抜き出していきます。
//
// それに続き、各依存対象が依存する対象を抜き出します。アプリケーションのすべての
// モジュールが互いにどのように依存しあっているのかを把握できるまで、上の工程を
// 繰り返します。このようにして得られるプロジェクトの全体像は、依存グラフと
// 呼ばれます。
function createGraph(entry) {
  // エントリーファイルのパースから始めます。
  const mainAsset = createAsset(entry);

  // すべてのアセットの依存対象をパースするためにキューを使います。そのために、
  // エントリーアセットのみを含む配列を定義します。
  const queue = [mainAsset];

  // `for ... of` ループによりキューを走査します。最初はキューには一つの
  // アセットしか含まれていませんが、繰り返しごとに新しいアセットをキューに
  // 追加していきます。このループは、キューから取り出す値がなくなったところで
  // 終了します。
  // (訳注: このコメントブロックの最後の文は、原文では"This loop will terminate
  // when the queue is empty." となっているが、queue が空になることはないため、
  // 表現を変更している)
  for (const asset of queue) {
    // すべてのアセットは、自身の依存対象への相対パスを保持しています。
    // それらを繰り返し取得し、`createAsset()` 関数によりパースし、
    // このモジュールの依存対象を下のオブジェクトにより記録します。
    asset.mapping = {};

    // このモジュールが含まれるディレクトリを表します。
    const dirname = path.dirname(asset.filename);

    // 依存対象への相対パスを走査します。
    asset.dependencies.forEach(relativePath => {
      // `createAsset()` 関数はファイルへの絶対パスを必要とします。一方、
      // 依存対象を保持する配列は相対パスの配列となっています。これらのパスは、
      // インポートする側のファイルに対する相対パスです。この相対パスを親の
      // アセットのディレクトリと結合することで、絶対パスが得られます。
      const absolutePath = path.join(dirname, relativePath);

      // アセットをパースし、内容を読み込み、依存対象を抜き出します。
      const child = createAsset(absolutePath);

      // 「アセット」が「子」に依存していると理解することは重要です。この関係を
      // 表現するために、`mapping` オブジェクトに新しいプロパティを追加し、
      // その値を子の id とします。
      asset.mapping[relativePath] = child.id;

      // 最後に、子のアセットをキューへと追加することで、依存対象自体も
      // パースされるようにします。
      queue.push(child);
    });
  }

  // この時点でキューは、ターゲットとなるアプリケーションに含まれるすべての
  // モジュールの配列となっています。これがグラフを表現したものとなります。
  return queue;
}

// Next, we define a function that will use our graph and return a bundle that
// we can run in the browser.
//
// Our bundle will have just one self-invoking function:
//
// (function() {})()
//
// That function will receive just one parameter: An object with information
// about every module in our graph.
function bundle(graph) {
  let modules = '';

  // Before we get to the body of that function, we'll construct the object that
  // we'll pass to it as a parameter. Please note that this string that we're
  // building gets wrapped by two curly braces ({}) so for every module, we add
  // a string of this format: `key: value,`.
  graph.forEach(mod => {
    // Every module in the graph has an entry in this object. We use the
    // module's id as the key and an array for the value (we have 2 values for
    // every module).
    //
    // The first value is the code of each module wrapped with a function. This
    // is because modules should be scoped: Defining a variable in one module
    // shouldn't affect others or the global scope.
    //
    // Our modules, after we transpiled them, use the CommonJS module system:
    // They expect a `require`, a `module` and an `exports` objects to be
    // available. Those are not normally available in the browser so we'll
    // implement them and inject them into our function wrappers.
    //
    // For the second value, we stringify the mapping between a module and its
    // dependencies. This is an object that looks like this:
    // { './relative/path': 1 }.
    //
    // This is because the transpiled code of our modules has calls to
    // `require()` with relative paths. When this function is called, we should
    // be able to know which module in the graph corresponds to that relative
    // path for this module.
    modules += `${mod.id}: [
      function (require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });

  // Finally, we implement the body of the self-invoking function.
  //
  // We start by creating a `require()` function: It accepts a module id and
  // looks for it in the `modules` object we constructed previously. We
  // destructure over the two-value array to get our function wrapper and the
  // mapping object.
  //
  // The code of our modules has calls to `require()` with relative file paths
  // instead of module ids. Our require function expects module ids. Also, two
  // modules might `require()` the same relative path but mean two different
  // modules.
  //
  // To handle that, when a module is required we create a new, dedicated
  // `require` function for it to use. It will be specific to that module and
  // will know to turn its relative paths into ids by using the module's
  // mapping object. The mapping object is exactly that, a mapping between
  // relative paths and module ids for that specific module.
  //
  // Lastly, with CommonJs, when a module is required, it can expose values by
  // mutating its `exports` object. The `exports` object, after it has been
  // changed by the module's code, is returned from the `require()` function.
  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(name) {
          return require(mapping[name]);
        }

        const module = { exports : {} };

        fn(localRequire, module, module.exports);

        return module.exports;
      }

      require(0);
    })({${modules}})
  `;

  // We simply return the result, hurray! :)
  return result;
}

const graph = createGraph('./example/entry.js');
const result = bundle(graph);

console.log(result);
