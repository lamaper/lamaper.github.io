---
title: WSL与WSA的安装配置
description: WSL与WSA的安装、介绍
author: E-butx
date: 2022-10-29 20:12:00 +0800
categories: [Blogs]
tags: [wsl, wsa]
math: true
mermaid: true
toc: true
---
本文作者是E-butx，系彼时西安铁一中滨河高级中学机房中的一群人，我在后面进行了WSA的补充

### WSL安装

WSL（Windows Subsystem for Linux，适用于Windows的Linux子系统）

> The Windows Subsystem for Linux lets developers run a GNU/Linux  environment -- including most command-line tools, utilities, and  applications -- directly on Windows, unmodified, without the overhead of a virtual machine.
>
> 摘自 <https://docs.microsoft.com/>

> 简单的说就是，Linux 的 Windows 子系统让开发人员`无需虚拟机`就可以直接在 Windows 上运行 Linux 环境，包括大多数命令行工具、程序和应用。
>
> 摘自 <https://www.zhihu.com/>

WSL1 VS WSL2

| 功能                                           | WSL 1 | WSL 2 |
| ---------------------------------------------- | ----- | ----- |
| Windows 和 Linux 之间的集成                    | ✅     | ✅     |
| 启动时间短                                     | ✅     | ✅     |
| 与传统虚拟机相比，占用的资源量少               | ✅     | ✅     |
| 可以与当前版本的 VMware 和 VirtualBox 一起运行 | ✅     | ✅     |
| 托管 VM                                        | ❌     | ✅     |
| 完整的 Linux 内核                              | ❌     | ✅     |
| 完全的系统调用兼容性                           | ❌     | ✅     |
| 跨 OS 文件系统的性能                           | ✅     | ❌     |

> WSL 2 是适用于 Linux 的 Windows 子系统体系结构的一个新版本，它支持适用于 Linux 的 Windows 子系统在 Windows 上运行 ELF64 Linux 二进制文件。 它的主要目标是**提高文件系统性能**，以及添加**完全的系统调用兼容性**。
>
> 这一新的体系结构改变了这些 Linux 二进制文件与Windows 和计算机硬件进行交互的方式，但仍然提供与 WSL 1（当前广泛可用的版本）中相同的用户体验。
>
> 单个 Linux 分发版可以在 WSL 1 或 WSL 2 体系结构中运行。 每个分发版可随时升级或降级，并且你可以并行运行 WSL 1 和 WSL 2 分发版。 WSL 2 使用全新的体系结构，该体系结构受益于运行真正的 Linux 内核。
>
> 
>
> 以上摘自 <https://docs.microsoft.com/>

> `WSL`：并不是一个真正的 `Linux` 操作系统，仅仅是 `Linux` 应用程序与 `Windows` 操作系统之间的一个适配层。
>
> 在这个适配层之上，可以运行 `Linux` 应用程序，有点类似于以前的 `cygwin` 的方式。
>
> `WSL2`：它就是一个虚拟机，类似于 `Vitual Box`，在这个虚拟机之上，运行一个完整的 `Linux` 操作系统。
>
> 相对于 `Virtual Box`、`VMWare` 来说，WSL2提供更全面的兼容性、与 `Windows` 系统的互操作性更好、运行速度更快、占用系统资源更少。
>
> 摘自 <https://cloud.tencent.com/developer/article/>

#### 1、启动windows子系统与虚拟化

首先需要把CPU的虚拟化打开，可以通过任务管理器查看是否启动了虚拟化。

接着在**控制面板\程序与功能\启动或关闭Windows功能**中选择**Hyper-V，适用于Linux的Windows子系统、虚拟机平台**并保存，之后重启。

#### 2、升级

下载Microsoft提供的[适用于 x64 计算机的 WSL2 Linux 内核更新包](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)

Windows11下，使用PowerShell，输入

```cmd
wsl --update --web-download
```

注意，缺少参数`--web-download`会导致进度条卡顿，原因是国内微软下载无法连接。

#### 3、安装

命令行安装。

```shell
wsl --list --online # 显示所有可用的分发版
wsl --install --distribution kali-linux # 安装分发版
```

在此之后只需运行新安装的分发版即可。它会让你等待一段时间，然后要求你键入 Username 和 Password（这里假设是 testuser 和 123456）。

在默认情况下，wsl的存储地址在C盘，可以通过导入导出更换目录；

```shell
wsl --export kali-linux C:\kali.tar # 导出为tar包
wsl --unregister kali-linux # 删除当前分发
wsl --import kali-linux <目标路径> C:\kali.tar --version 2# 重新导入

wsl -l -v # 检查是否导入成功
kali config --default-user testuser # 设置用户为安装时创建的
```

如果需要关闭虚拟机，则使用：

```cmd
wsl --terminate kali-linux
```

### WSA安装

> Windows Subsystem for Android （*中文译名：适用于 Android™️ 的 Windows 子系统）* 包括 Linux内核和基于 Android开源项目（AOSP）版本的 Android 操作系统。该子系统在 Hyper-V 虚拟机中运行，可以将 AOSP 环境中 App 的运行时和 API 映射到 Windows 图形层、内存缓冲区、输入模式、物理和虚拟设备以及传感器，已现身微软商店，需要 8GB 内存并推荐 16GB 配置，可在 ARM64 或 x64 处理器以及英特尔、AMD、高通的 CPU 上运行。 Windows Subsystem for Android将面向 Beta 通道的美国用户开启测试。 
>
> 2024年3月6日，微软公布公告，适用于安卓的 Windows 子系统（WSA）和亚马逊应用商店将在 2025 年 3 月 5 日之后**不再**在 Microsoft Store 中提供。 

#### 1、下载安装必要文件

在[Microsoft Store - Generation Project (v1.2.3)](https://store.rg-adguard.net/)中左侧选择对应通道「ProductId」，并在中间输入 WSA 的产品代码「9P3395VX91NR」，在右边按需选择更新通道，推荐选择「Fast」下载如下文件。

[Microsoft.UI.Xaml.2.8_8.2310.30001.0_x64__8wekyb3d8bbwe.appx](http://tlu.dl.delivery.mp.microsoft.com/filestreamingservice/files/251bbb12-dbfc-4820-b0ff-c4dfa70ffb09?P1=1733823405&P2=404&P3=2&P4=ArYKuZZRkvhPSBW7j5RFW3fFJCblJppXG%2f60HCmrNUMap1535A2blRbxGghSuXjjUfRnzzls2e5seS1ThdnA%2bw%3d%3d)

[MicrosoftCorporationII.WindowsSubsystemForAndroid_2407.40000.4.0_neutral_~_8wekyb3d8bbwe.msixbundle](http://tlu.dl.delivery.mp.microsoft.com/filestreamingservice/files/a2d3c8e4-ff45-4291-8888-1472ee125fb5?P1=1733851164&P2=404&P3=2&P4=BLyCMJqgtnyXYLQ3gaI2zat6CaGksHEhFAtuJpXw7%2bzxZumOdg9%2fkK3bwr5Cx1Hcj%2fCKCAnCl96ulCn2Wt4S9A%3d%3d)

下载之后重命名并用命令行安装，或者



[Windows Subsystem for Android™ with Amazon Appstore - Windows官方下载 | 微软应用商店 | Microsoft Store](https://apps.microsoft.com/detail/9p3395vx91nr?hl=zh-cn&gl=us)

#### 2、安装SDK

在[SDK 平台工具版本说明  | Android Studio  | Android Developers](https://developer.android.google.cn/tools/releases/platform-tools?hl=zh-cn)下载适用于 Windows 的 SDK Platform-Tools，并将其添加到环境变量中





