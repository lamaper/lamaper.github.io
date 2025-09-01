+++
date = '2024-10-28T21:13:03+08:00'
draft = false
title = 'GitHubPages + Hugo博客搭建记录（1）'
tags = ['blogs', 'hugo']
categories = ['blogs']
+++

今日打开尘封多年的github pages，搭建自己的博客，为了防止重构时忘了怎么搞，故做个笔记。

### 〇、远程连接仓库

首先创建一个username.github.io的仓库，作为github pages的目录

### 一、安装Hugo

进入hugo官方仓库，下载最新release：[Releases · gohugoio/hugo](https://github.com/gohugoio/hugo/releases)

我用的windows11，所以下载amd64版本。如果在虚拟机上运行，应当下载linux-amd64版本。

hugo的配置很简单，下载下来的压缩包里只有`hugo.exe`，只需要将其放到任意安装目录即可。

我将hugo安装到`E:\ProgramFile\hugo`中，并将此目录配置到环境变量`path`中，当启动powershell，输入hugo有反应时，表明hugo配置成功。

### 二、初始化网页

切换到工作目录，创建自己的网站：

```cmd
cd D:\Workspace
hugo new site MyGitHubPages
```

接着，进入工作目录：

```cmd
hugo -D
```

这样便会生成一个发布版的网页，目录为`.\MyGitHubPages\public`，为了方便使用，我们把这里设为git仓库。

在这之前，清空public中的所有文件，然后

```cmd
git pull remote http://github.com/<MY sites>
git add .
git commit -m "first commit"
git push origin main
```

### 三、配置主题

我选择了hyde主题，导入主题需要如此操作：

```cmd
cd D:\Workspace\MyGitHubPages\themes
git clone https://github.com/spf13/hyde.git
```

然后配置`hugo.toml`

```cmd
code .
```

修改文件内容为：

```toml
baseURL = 'https://lamaper.github.io/'
languageCode = 'zh-CN'
title = 'lamaper'
theme = 'hyde'

[Menus]
  main = [
      {Name = "Github", URL = "https://github.com/lamaper/"},
      {Name = "博客园", URL = "https://lamaper.cnblogs.com/"}
  ]

[params]
  description = "你好，我是lamaper，BIT信科大一学生，喜欢与计算机相关的所有东西！"
```

参考文献[Hyde主题使用教程 · Hyou](https://www.cjlmonster.cn/日常/hyde/#sidebar-menu)