+++
date = '2025-01-15T23:00:00+08:00'
draft = false
title = 'Qt6.7.3静态编译全过程'
tags = ['coding', 'qt']
categories = ['coding']
+++

自从2022年与学长们一起使用Qt尝试开发软件以来，我一直苦恼于Qt生成的桌面程序的庞大体积，因为动态链接库的巨大，导致再简单的程序也有54.5MB以上的体积，如何解决这个问题呢？解决方法是静态编译Qt的源代码。但由于当时电脑比较垃圾，个人也没研究透彻，静态编译过程中出现了各种问题导致失败。今天终于解决了这问题，以此写一篇博客供以后参考回忆。

## 一、下载与安装必要文件和程序

### 1、下载源码

静态编译是在Qt源代码基础上进行的，因此本地必须要有Qt的源代码。

[在Qt官网下载Qt6.7.3的源码](https://download.qt.io/archive/qt/6.7/6.7.3/single/qt-everywhere-src-6.7.3.zip)

也可以在[Index of /qt/archive/qt/6.7/6.7.3/single/ | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/qt/archive/qt/6.7/6.7.3/single/)下载

源码的地址是`archive/qt/6.7/6.7.3/single/qt-everywhere-src-6.7.3.zip`

下载好后直接解压到任意目录即可

### 2、配置环境

#### （1）安装Visual Studio

[下载 Visual Studio Tools - 免费安装 Windows、Mac、Linux](https://visualstudio.microsoft.com/zh-hans/downloads/)

选择社区版，勾选“使用C++的桌面开发”并执行安装即可

![](https://pic1.imgdb.cn/item/6787dbb1d0e0a243d4f49a53.png)

#### （2）下载并安装cmake

[Download CMake](https://cmake.org/download/)

选择Windows x64 Installer即可

注意勾选添加环境变量

![](https://pic1.imgdb.cn/item/6787db58d0e0a243d4f49a4e.png)



#### （3）调整ninja或安装ninja

如果已经安装过Qt，可以在Qt目录下`Qt/Tools/Ninja`找到

![](https://pic1.imgdb.cn/item/6787dae6d0e0a243d4f49a2b.png)

如果没有安装Qt，可以在https://github.com/ninja-build/ninja/releases下载

然后将其加入环境变量

#### （4）安装Perl、Ruby、Python3

除了Python3是已知必须的以外，Perl和Ruby是我在其他博客中看到的，秉持着一次搞定的心态，我全部安装了，但是不能确定Ruby和Perl是否真的在静态编译中起到了作用（也许是某些历史遗留问题）

这里不深入研究这个问题，能装就都装上。

Ruby下载地址： https://rubyinstaller.org/downloads/

Python下载地址： https://www.python.org/downloads/windows/

Perl下载地址： https://www.python.org/downloads/windows/

需要注意的是，Ruby最好选择Ruby+Devkit版本。其中Ruby和Python都带有自己的exe安装程序，但是Perl下载下来是一个zip压缩包，完全解压到安装目录后，根据readme.txt中的内容进行设置。实际上运行`portableshell.bat`即可。

## 二、进行编译

在解压的源码目录下`.\Qt\qt-everywhere-src-6.7.3\qtbase\mkspecs\common`，找到`msvc-desktop.conf`

![](https://pic1.imgdb.cn/item/6787dae5d0e0a243d4f49a28.png709.png)

用记事本打开，修改内容：

![](https://pic1.imgdb.cn/item/6787db57d0e0a243d4f49a4c.png)

![](https://pic1.imgdb.cn/item/6787db56d0e0a243d4f49a4b.png)

将其中所有**MD**修改为**MT**，其中D的意思是动态编译（dynamic），T的意思是静态编译（static）源码。

然后选择Visual Studio中的`x64 Native Tools Command Prompt for VS 2022`运行：

![](https://pic1.imgdb.cn/item/6787dae6d0e0a243d4f49a29.png)

切换到目录`.\Qt\qt-everywhere-src-6.7.3`下，输入命令：

```cmd
configure.bat -static -static-runtime -prefix "E:\ProgramFile\Qt\qt6.7.3-static" -confirm-license -opensource -debug-and-release -platform win32-msvc  -nomake examples -nomake tests   -qt-zlib -qt-libpng -qt-libjpeg -opengl dynamic
```

其中，根据需要，修改双引号内的路径，这是最终静态编译结果的生成地址，指令参数解读如下：

> configure.bat
>
> -static -static-runtime //指明是静态编译
>
> -prefix "E:\ProgramFile\Qt\qt6.7.3-static" //指明安装的目录
>
> -confirm-license -opensource  //指明是开源版本的qt
>
> -debug-and-release //指明需要debug版和release版，可以单独选择release版
>
> -platform win32-msvc  //指明使用msvc编译
>
> -nomake examples -nomake tests  //不编译样例
>
> -qt-zlib -qt-libpng -qt-libjpeg  //可选插件
>
> -opengl dynamic

运行指令后会得到系列cmake清单，此时只需要再次输入

```cmd
cmake --build . --parallel 6
```

其中`--parallel 6`是指开启线程数为6的多线程编译

接下来就是漫长的等待，大概需要编译19000项左右，个人用Intel Ultra5 125H跑了1个小时多一点。

编译结束后，输入：

```cmd
ninja install
```

进行安装即可

## 三、配置Qt Creator

打开Qt Creator，进入首选项：

![](https://pic1.imgdb.cn/item/6787dae7d0e0a243d4f49a2c.png)

选择【Qt版本】，点击【添加】

![](https://pic1.imgdb.cn/item/6787db58d0e0a243d4f49a4d.png)

选择编译结果的路径中的qmake.exe即可：

![](https://pic1.imgdb.cn/item/6787db54d0e0a243d4f49a4a.png)

接下来点击【构建套件】：

![](0689https://pic1.imgdb.cn/item/6787dae6d0e0a243d4f49a2a.png)

![](https://pic1.imgdb.cn/item/6787dbb1d0e0a243d4f49a52.png)

将【Qt版本】设置为刚刚添加的版本即可。

最终在构建项目时，不要选择cmake，**选择qmake**，即可进行静态编译。



## 注意

qmake.exe是在Qt安装编译时生成的，里面内嵌了Qt相关的一些路径。如果直接拷贝过来使用，自己的路径结构与原来不同，则Qt库就不能正常使用。提示为：

> Qt version is not properly installed,please run make install
> Qt没有被正确安装，请运行make install

在编译过的库bin目录下，新建一个`qt.conf`（必须是ANSI编码）

```toml
[paths]
Prefix = ..
```

