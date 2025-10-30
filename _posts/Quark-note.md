+++
date = '2023-10-05T14:06:00+08:00'
draft = false
title = 'Quark-n（夸克开发板）学习笔记'
tags = ['coding', 'quark', 'linux']
categories = ['coding']
+++

author：lamaper

## 一、准备工序

首先需要了解夸克（Quark）的各种属性，这是夸克开发板的wiki：[“夸克（Quark）”迷你开发者套件 | Seeed Studio Wiki](https://wiki.seeedstudio.com/cn/Quantum-Mini-Linux-Development-Kit/)。

夸克使用全志3芯片，发热很高，需要加装散热片或风扇。

夸克使用USB Type-C进行供电和数据传输，可以使用虚拟终端软件来连接开发板，推荐的连接软件有*MobaXtrem*和*XShell*，[MobaXterm个人版下载地址 (mobatek.net)](https://mobaxterm.mobatek.net/download-home-edition.html)，[XSHELL 下载地址](https://www.xshell.com/zh/xshell/)。

需要注意的是在使用Type-C连接开发板时，一定要下载对应的驱动，否则无法正常连接，出现的报错为：”未能成功安装驱动设备和程序“

![20230910233342](D:\TyporaImages\20230910233342.jpg)

观察到报错信息为”CP2102N USB to UART Bridge Controller“驱动未安装，所以我们下载相应的驱动[CP2102 USB to UART Bridge Controller 驱动下载 - 驱动天空 (drvsky.com)](https://www.drvsky.com/driver/CP2102.htm)，安装成功后即可正常连接。

接下来我们通过MobaXterm连接开发板，在主界面找到Session；


然后选择Serial，找到对应的串口连接，调整数据传输速度Speed到适应的数值，点击OK即可正常连接。

推荐观看[【教你玩】稚晖君的夸克的EMMC、扩容、WIFI、GPIO_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1144y1E7wX/?spm_id_from=333.788&vd_source=dfff592efb4ad4e2eb9d4bfa3fde8b62)

## 二、基础设置

### 1、安装系统

> 与树莓派一样，Quark-N可以通过SD卡上面烧录的镜像启动系统，但是也可以通过SOM上搭载的eMMC启动系统。启动顺序是这样的：
>
> - 当检测到SD卡插入且包含可启动的系统时，会进入SD卡系统
> - 否则如果eMMC中有可启动的系统的话，就会进入eMMC的系统
>
> 另外值得注意的是，不论是从SD卡启动还是从eMMC启动，当前运行系统所在的储存设备名都是`/dev/mmcblk0`，操作相关文件的时候不要弄错了。
>
> **比较合理的开发模式是：**
>
> 1. 使用Atom-N开发套件验证您的项目，运行在SD卡中的镜像系统
>
> 2. 验证完成项目之后通过Atom-N底板将SD卡中调试好的系统通过`dd命令`等方式拷贝到eMMC
>
> 3. 设计自己的底板（无需添加SD卡），插上调试好的Quark-N顺利部署系统
>
>    [^*]: 来自 [“夸克（Quark）”迷你开发者套件 | Seeed Studio Wiki](https://wiki.seeedstudio.com/cn/Quantum-Mini-Linux-Development-Kit/)

我们可以先烧录镜像到TF卡上，然后拷贝到emmc中，进行首次亮机。

首先下载最新系统镜像[quark-n-21-1-11](https://files.seeedstudio.com/wiki/Quantum-Mini-Linux-Dev-Kit/quark-n-21-1-11.zip)，然后使用[balenaEtcher - Flash OS images to SD cards & USB drives](https://etcher.balena.io/)工具将镜像烧录到TF卡中，紧接着插入TF到开发板卡槽中，启动开发板。

进入系统后首先转移系统到emmc上，在此之前，先通过`sudo fdisk -i`获得磁盘参数，然后运行以下命令

```bash
sudo dd if=/dev/mmcblk0 of=/dev/mmcblk1 bs=512 count="EMMC的Block数+1" &
```

为了观察复制进度，运行以下命令：

```bash
sudo watch -n 5 pkill -USR1 ^dd$
```

等待复制结束后，emmc中存在一个新的系统。此时拔掉TF卡，重新启动开发板，进入到emmc系统中。

### 2、联网

首先在emmc中启动WiFi，

```bash
sudo nmcli r wifi on
```

扫描附近的WiFi，

```bash
sudo nmcli dev wifi
```

首次链接特定的WiFi：

```bash
sudo nmcli dev wifi connect "SSID" password "PASSWORD"
```

重启网卡，

```bash
sudo ifconfig wlan0 down
sudo ifconfig wlan0 up
```

ping百度检查网络连接，

```bash
ping www.baidu.com
```

### 3、扩容

在emmc环境下，使用命令，

```bash
sudo fdisk -l
```

发现TF的可用空间很小，一大部分都未被使用，因而我们需要扩容空间，在联网的前提下，查看开发板ip，

```bash
ifconfig
```

之后使用Windows自带的远程桌面连接：

![image-20230928222526239](D:\TyporaImages\image-20230928222526239.png)

用户名为pi，密码为quark

![image-20230928222625970](D:\TyporaImages\image-20230928222625970.png)

右键file system/Applications/System/Gparted，进入界面

![image-20230928223159338](C:\Users\lamaper\AppData\Roaming\Typora\typora-user-images\image-20230928223159338.png)

对TF卡进行操作，修改mmcblk1p3的大小，最后点击最上方对勾完成修改。

注意：mmcblk0是当前运行的系统磁盘，无法修改，只能修改mmcblk1，上图举例没有切换为emmc系统

### 4、更新

扩容结束后，通过TF重新启动，现在将ubuntu16.04升级到18.04，注意，此时TF系统没有联网，需要重复上述联网操作，然后：

```bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get autoremove
sudo apt dist-upgrade
```

安装update-manager-core，执行如下命令：

```shell
sudo apt-get install update-manager-core
```

执行系统升级，执行如下命令：

```shell
sudo do-release-upgrade
```

**[升级过程中遇到的问题](https://wiki.seeedstudio.com/cn/Quantum-Mini-Linux-Development-Kit/#升级过程中遇到的问题)**提示 “Your python3 install is corrupted. Please fix the ‘/usr/bin/python3’ symlink.”，执行如下命令：

```shell
sudo ln -sf /usr/bin/python2.7 /usr/bin/python
sudo ln -sf /usr/bin/python3.5 /usr/bin/python3
```

更新后需要重新配置python3，

首先安装python3的pip模块，

```bash
sudo apt-get install python3-pip
```

安装python3的包，

```bash
sudo python3 -m pip install fire 
sudo python3 -m pip install ruamel.yaml 
sudo python3 -m pip install pygame==1.9.6 
sudo python3 -m pip install python-periphery 
sudo python3 -m pip install PyYAML 
sudo python3 -m pip install Markdown 
sudo python3 -m pip install tornado 
sudo python3 -m pip install smbus
sudo python3 -m pip install Pillow
sudo python3 -m pip install numpy
```

更新之后，xrdp会出现问题无法启动，这时要解决这个问题：

```bash
cd Workspace/
mkdir Git/
cd Git/
git clone https://gitee.com/coolflyreg163/quark-n.git
cd quark-n/
```

备份并改变xrdp配置文件：

```bash
sudo cp /etc/xrdp/sesman.ini /etc/xrdp/sesman.ini.back
sudo cp /etc/xrdp/xrdp.ini /etc/xrdp/xrdp.ini.back

sudo cp ~/Workspace/Git/quark-n/sesman.ini /etc/xrdp/sesman.ini
sudo cp ~/Workspace/Git/quark-n/xrdp.ini /etc/xrdp/xrdp.ini
```

之后远程桌面可以正常启动。

### 5、安装依赖

docker是常用的容器管理工具，安装docker会让项目部署更加便捷：

```bash
sudo apt-get install docker
```

java是运行很多服务端程序必须的环境，java主流的长期支持版本有java8和java17，这里使用java17：

```bash
sudo apt-get install openjdk-17-jre
```



## 三、部署项目

### 1、[数码屏](https://gitee.com/coolflyreg163/quark-n/tree/master/#用于自带lcd屏的数码时钟)

1. 下载源代码

   ```
   mkdir ~/GIT
   cd ~/GIT
   git clone https://gitee.com/coolflyreg163/quark-n.git 
   ```

2. 如果很早之前已经下载过源代码，需要更新，可以运行如下命令（这一步非必须）

   ```
   cd ~/GIT/quark-n
   git pull origin master
   ```

3. 备份之前的Clock

   ```
   cd /home/pi/WorkSpace/
   mv Clock Clock_bak
   ```

4. 将Clock放置到指定位置

   ```
   ln -s /home/pi/GIT/quark-n/WorkSpace/Clock ~/WorkSpace/
   ```

5. 将启动脚本放置到指定位置

   ```
   chmod +x /home/pi/GIT/quark-n/WorkSpace/Scripts/start_ui_clock.sh
   mkdir -p ~/WorkSpace/Scripts/services
   ln -s /home/pi/GIT/quark-n/WorkSpace/Scripts/services/ui_clock.service ~/WorkSpace/Scripts/services/
   ln -s /home/pi/GIT/quark-n/WorkSpace/Scripts/start_ui_clock.sh ~/WorkSpace/Scripts/
   ```

6. 从这里，下载2个字体文件：“STHeiti Light.ttc”，“PingFang.ttc”，拷贝到~/WorkSpace/Clock/fonts。

   ```
   https://gitee.com/coolflyreg163/quark-n/releases/Fonts
   ```

   或运行命令

   ```
   cd ~/WorkSpace/Clock/fonts
   wget https://gitee.com/coolflyreg163/quark-n/attach_files/603438/download/STHeiti%20Light.ttc
   wget https://gitee.com/coolflyreg163/quark-n/attach_files/603439/download/PingFang.ttc
   ```

7. 运行如下命令进行安装

   ```
   cd /home/pi/WorkSpace/Clock/
   sudo python -m pip install --index http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt
   mkdir /home/pi/WorkSpace/Clock/logs
   sudo ln -s /home/pi/WorkSpace/Scripts/services/ui_clock.service /lib/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable ui_clock
   ```

   **ruamel.yaml 需要使用阿里云的镜像来安装，豆瓣的镜像里没有！**

   到达这一步，已经在重启后会自动启动。下面是手动命令

8. 命令提示：

   1. 启动 （手动启动后按Ctrl + C可脱离）

      ```
      sudo systemctl start ui_clock
      ```

   2. 停止

      ```
      sudo systemctl stop ui_clock
      ```

   3. 查看状态

      ```
      sudo systemctl status ui_clock
      ```

   4. 重启系统

      ```
      sudo shutdown -r now
      ```

```
sudo nmcli connection add \
 type wifi con-name "BIT-Mobile" ifname wlp3s0 ssid "BIT-Mobile" -- \
 wifi-sec.key-mgmt wpa-eap 802-1x.eap ttls \
 802-1x.phase2-auth mschapv2 802-1x.identity "1120241725" 
```