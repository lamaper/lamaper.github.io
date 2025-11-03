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
---

# Flask框架的安全研究

Flask是一个使用Python编写的轻量级Web应用框架，被称为“微框架”。它的核心简单且可扩展，通过扩展可以增加其他功能。Flask基于Werkzeug WSGI工具包和Jinja2模板引擎。其中`Werkzeug` 是一个 WSGI 工具包，用于处理 HTTP 请求和响应。`Jinja2` 是一个灵活的模板引擎，用于生成动态 HTML 页面。

这是flask的用例图：

![tupian](https://i-blog.csdnimg.cn/direct/da477e83ff3d455aad6456e184a6decf.png)

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





```python
    @internalcode
    def compile(
        self,
        source: t.Union[str, nodes.Template],
        name: t.Optional[str] = None,
        filename: t.Optional[str] = None,
        raw: bool = False,
        defer_init: bool = False,
    ) -> t.Union[str, CodeType]:
        """Compile a node or template source code.  The `name` parameter is
        the load name of the template after it was joined using
        :meth:`join_path` if necessary, not the filename on the file system.
        the `filename` parameter is the estimated filename of the template on
        the file system.  If the template came from a database or memory this
        can be omitted.

        The return value of this method is a python code object.  If the `raw`
        parameter is `True` the return value will be a string with python
        code equivalent to the bytecode returned otherwise.  This method is
        mainly used internally.

        `defer_init` is use internally to aid the module code generator.  This
        causes the generated code to be able to import without the global
        environment variable to be set.

        .. versionadded:: 2.4
           `defer_init` parameter added.
        """
        source_hint = None
        try:
            if isinstance(source, str):
                source_hint = source
                source = self._parse(source, name, filename)
            source = self._generate(source, name, filename, defer_init=defer_init)
            if raw:
                return source
            if filename is None:
                filename = "<template>"
            return self._compile(source, filename)
        except TemplateSyntaxError:
            self.handle_exception(source=source_hint)
```



