---
title: 比亚兹AX286/UK15无线网卡(aic8800)的Ubuntu22.04驱动
description: 小改使其能够使用
author: lamaper
date: 2026-03-04 20:30:21 +0800
categories: [Tinkering]
tags: [ubuntu, linux, wifi, dirve, aic8800, c]
math: true
mermaid: true
toc: true
render_with_liquid: true
---

仓库地址：[https://github.com/lamaper/Biaze-AX286-UK15-aic8800-dirve-for-Ubuntu22.04](https://github.com/lamaper/Biaze-AX286-UK15-aic8800-dirve-for-Ubuntu22.04)

## 前言

事情的起因是我的E3神机时不时在学校断连，我不得不每两三天就跑到我的神秘打野点去修一下。关键是我的E3神机并没有显示器，
每次连接都是用HDMI+采集卡，用我笔记本的OBS当显示器，一通折腾让人恼火不已。
我猜测可能是Windows的奇妙策略影响了联网~~（后来发现不是）~~，于是我便直接将其重装成Ubuntu22.04，
还方便以后直接ssh连接。

由于神秘打野点没有网口，我只能通过USB无线网卡来联网，重装之前京东客服跟我确认说是linux免驱动直接用，
没想到装好了连不上，客服磨磨唧唧发出来个网盘链接，我直接一通操作：

```bash
sudo dpkg -i aic8800fdrvpackage_amd64.deb
```

发现不太对劲，怎么老报错，一查发现我安装没联网，整个电脑没有build-essential，这逆天完了。

我陷入了死循环，没网就装不了build-essential，没有它我又装不上驱动连不了网。于是我又费尽心思把神机搬回宿舍，
插上网线，再次一通操作

```bash
sudo apt update && sudo apt install build-essential

sudo dpkg -i aic8800fdrvpackage_amd64.deb
```

结果报错更彻底了。经过研究我发现，这个驱动甚老，不支持我2204，尽管我已经想到兼容性问题没装2404，也没逃过这劫。

于是便有了如下维修步骤：


## 安装与维修步骤

> [!CAUTION]
>
> 对于Ubuntu22.04如果遇到如下报错，则需要更新gcc版本

 ```
lamaper@lamaper-server:~/tmp$ sudo dpkg -i aic8800fdrvpackage_amd64_2023_0807.deb 
 正在选中未选择的软件包 aic8800fdrvpackage。
(正在读取数据库 ... 系统当前共安装有 178549 个文件和目录。)
 准备解压 aic8800fdrvpackage_amd64_2023_0807.deb  ...
 Install aic8800 wifi driver!!!!!
 正在解压 aic8800fdrvpackage (1.0.1) ...
 正在设置 aic8800fdrvpackage (1.0.1) ...
 udev done
 device not exist
 cp fw done
 make -C /lib/modules/6.8.0-40-generic/build M=/AIC8800/drivers/aic8800 ARCH=x86_64 CROSS_COMPILE= modules
 make[1]: 进入目录“/usr/src/linux-headers-6.8.0-40-generic”
 warning: the compiler differs from the one used to build the kernel
   The kernel was built by: x86_64-linux-gnu-gcc-12 (Ubuntu 12.3.0-1ubuntu1~22.04) 12.3.0
   You are using:           
   CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aic_bluetooth_main.o
 /bin/sh: 1: gcc-12: not found
 make[4]: *** [scripts/Makefile.build:243：/AIC8800/drivers/aic8800/aic_load_fw/aic_bluetooth_main.o] 错误 127
 make[3]: *** [scripts/Makefile.build:481：/AIC8800/drivers/aic8800/aic_load_fw] 错误 2
 make[2]: *** [/usr/src/linux-headers-6.8.0-40-generic/Makefile:1926：/AIC8800/drivers/aic8800] 错误 2
 make[1]: *** [Makefile:240：__sub-make] 错误 2
 make[1]: 离开目录“/usr/src/linux-headers-6.8.0-40-generic”
 make: *** [Makefile:55：modules] 错误 2
 mkdir -p /lib/modules/6.8.0-40-generic/kernel/drivers/net/wireless/aic8800
 install -p -m 644 aic_load_fw/aic_load_fw.ko  /lib/modules/6.8.0-40-generic/kernel/drivers/net/wireless/aic8800/
 install: 对 'aic_load_fw/aic_load_fw.ko' 调用 stat 失败: 没有那个文件或目录
 make: *** [Makefile:59：install] 错误 1
 insmod: ERROR: could not load module /AIC8800/drivers/aic8800/aic_load_fw/aic_load_fw.ko: No such file or directory
 insmod: ERROR: could not load module /AIC8800/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.ko: No such file or directory
 insmod done
 gcc -c wifi_test.c -o wifi_test.o
 gcc wifi_test.o -o wifi_test
 gcc -c bt_test.c -o bt_test.o
 gcc bt_test.o -lpthread -o bt_test
 sudo cp wifi_test /sbin
 sudo cp bt_test /sbin
 Install aic8800 wifi driver successful!!!!!
 ```

 解决方法：

 1. 安装 GCC 12 及其关联工具

 ```bash
sudo apt update
 sudo apt install gcc-12 g++-12
 ```

 2. 设置系统默认使用 GCC 12
 ```bash
 sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-12 100 --slave /usr/bin/g++ g++ /usr/bin/g++-12
 ```
 3. 卸载残留并重装

 ```bash
 sudo dpkg -r aic8800fdrvpackage
 sudo dpkg -i aic8800fdrvpackage_amd64.deb
 ```

在修正之前需要说明，此时修正**不能**卸载原来的deb安装包，我们要在安装目录中修改代码，所以也不能使用`dpkg`命令，全程使用：

```bash
sudo make -C /lib/modules/$(uname -r)/build M=$PWD ARCH=x86_64 CROSS_COMPILE= KCFLAGS="-w" modules
```

在`/AIC8800/drivers/aic8800`目录下操作。

当输出如下内容的时候，视为正确编译：

```
lamaper@lamaper-server:/AIC8800/drivers/aic8800$ sudo make -C /lib/modules/$(uname -r)/build M=$PWD ARCH=x86_64 CROSS_COMPILE= KCFLAGS="-w" modules
make: 进入目录“/usr/src/linux-headers-6.8.0-40-generic”
warning: the compiler differs from the one used to build the kernel
  The kernel was built by: x86_64-linux-gnu-gcc-12 (Ubuntu 12.3.0-1ubuntu1~22.04) 12.3.0
  You are using:           gcc-12 (Ubuntu 12.3.0-1ubuntu1~22.04.3) 12.3.0
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_mod_params.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_mesh.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_platform.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_pci.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_dini.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_v7.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/ipc_host.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_tdls.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/regdb.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/md5.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/aicwf_compat_8800dc.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_radar.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_debugfs.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_fw_trace.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/usb_host.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/aicwf_txrxif.o
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/aicwf_usb.o
  LD [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aic_bluetooth_main.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aicbluetooth.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aicwf_usb.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aic_txrxif.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aicbluetooth_cmds.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/md5.o
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aicwf_txq_prealloc.o
  LD [M]  /AIC8800/drivers/aic8800/aic_load_fw/aic_load_fw.o
  MODPOST /AIC8800/drivers/aic8800/Module.symvers
  CC [M]  /AIC8800/drivers/aic8800/aic_load_fw/aic_load_fw.mod.o
  LD [M]  /AIC8800/drivers/aic8800/aic_load_fw/aic_load_fw.ko
  BTF [M] /AIC8800/drivers/aic8800/aic_load_fw/aic_load_fw.ko
Skipping BTF generation for /AIC8800/drivers/aic8800/aic_load_fw/aic_load_fw.ko due to unavailability of vmlinux
  CC [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.mod.o
  LD [M]  /AIC8800/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.ko
  BTF [M] /AIC8800/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.ko
Skipping BTF generation for /AIC8800/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.ko due to unavailability of vmlinux
make: 离开目录“/usr/src/linux-headers-6.8.0-40-generic”
```

然后按照如下步骤进行安装：

```
# 拷贝驱动文件到内核目录
sudo mkdir -p /lib/modules/$(uname -r)/kernel/drivers/net/wireless/aic8800

sudo cp aic_load_fw/aic_load_fw.ko aic8800_fdrv/aic8800_fdrv.ko /lib/modules/$(uname -r)/kernel/drivers/net/wireless/aic8800/

# 刷新系统内核模块依赖
sudo depmod -a

# 按照依赖顺序加载驱动
sudo modprobe aic_load_fw

sudo modprobe aic8800_fdrv
```

输入`ip a`看到类似信息说明安装成功：

```
...
3: wlx90de8093cc90: <NO-CARRIER,BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state DORMANT group default qlen 1000

    link/ether 90:de:80:93:cc:90 brd ff:ff:ff:ff:ff:ff 
```



### `aic8800_fdrv/rwnx_rx.c`

>  [!CAUTION]
>
> 对于Ubuntu22.04如果遇到如下报错，则需要手动修改源码：

```
/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_rx.c:458:9: error: too few arguments to function ‘ieee80211_amsdu_to_8023s’
  458 |         ieee80211_amsdu_to_8023s(skb, &list, rwnx_vif->ndev->dev_addr,
      |         ^~~~~~~~~~~~~~~~~~~~~~~~
In file included from /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_defs.h:20,
                 from /AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_rx.c:15:
./include/net/cfg80211.h:6623:6: note: declared here
 6623 | void ieee80211_amsdu_to_8023s(struct sk_buff *skb, struct sk_buff_head *list,
      |      ^~~~~~~~~~~~~~~~~~~~~~~~
/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_rx.c: At top level:
```

Ubuntu 22.04 使用了 **6.8.0 内核**，`ieee80211_amsdu_to_8023s` 这个函数的定义在较新的内核版本中发生了改变，增加了一个参数。官方的 aic8800 驱动源码是 2023 年的老版本，还在按旧版内核的方式调用这个函数，参数传少了，所以编译器直接报错。

需要修改`/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_rx.c`

找到：

```c
        ieee80211_amsdu_to_8023s(skb, &list, rwnx_vif->ndev->dev_addr,
                                 RWNX_VIF_TYPE(rwnx_vif), 0, NULL, NULL);
```

在形参列表后添加`false`

```c
        ieee80211_amsdu_to_8023s(skb, &list, rwnx_vif->ndev->dev_addr,
                                 RWNX_VIF_TYPE(rwnx_vif), 0, NULL, NULL, false);
```

即可。

### `aic8800_fdrv/rwnx_rx.c`

#### ‘struct wireless_dev’ has no member named ‘mtx’

```
/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_main.c:1057:30: error: ‘struct wireless_dev’ has no member named ‘mtx’
1057 |     mutex_lock(&vif->wdev.mtx);
   |               ^
```

在最新的内核里，`wdev.mtx` 这个互斥锁已经被上层接管并移除了。强行调用会导致编译失败，我们直接把它注释掉。

原代码：

```c
    if (error) {
        #if (LINUX_VERSION_CODE >= KERNEL_VERSION(3, 16, 0))
        cfg80211_stop_iface(rwnx_hw->wiphy, &vif->wdev, GFP_KERNEL);
        #else
        cfg80211_disconnected(vif->ndev, 0, NULL, 0, 0, GFP_KERNEL);
        #endif
    } else {
        mutex_lock(&vif->wdev.mtx);
        __acquire(&vif->wdev.mtx);
        spin_lock_bh(&rwnx_hw->cb_lock);
        rwnx_chanctx_unlink(vif);
        rwnx_chanctx_link(vif, csa->ch_idx, &csa->chandef);
        if (rwnx_hw->cur_chanctx == csa->ch_idx) {
            rwnx_radar_detection_enable_on_cur_channel(rwnx_hw);
            rwnx_txq_vif_start(vif, RWNX_TXQ_STOP_CHAN, rwnx_hw);
        } else
            rwnx_txq_vif_stop(vif, RWNX_TXQ_STOP_CHAN, rwnx_hw);
        spin_unlock_bh(&rwnx_hw->cb_lock);
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 18, 0))
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef, 0, 0);
#else
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef);
#endif

        mutex_unlock(&vif->wdev.mtx);
        __release(&vif->wdev.mtx);
    }
```

修改后：

```c
    if (error) {
        #if (LINUX_VERSION_CODE >= KERNEL_VERSION(3, 16, 0))
        cfg80211_stop_iface(rwnx_hw->wiphy, &vif->wdev, GFP_KERNEL);
        #else
        cfg80211_disconnected(vif->ndev, 0, NULL, 0, 0, GFP_KERNEL);
        #endif
    } else {
        //>> mutex_lock(&vif->wdev.mtx);
        __acquire(&vif->wdev.mtx);
        spin_lock_bh(&rwnx_hw->cb_lock);
        rwnx_chanctx_unlink(vif);
        rwnx_chanctx_link(vif, csa->ch_idx, &csa->chandef);
        if (rwnx_hw->cur_chanctx == csa->ch_idx) {
            rwnx_radar_detection_enable_on_cur_channel(rwnx_hw);
            rwnx_txq_vif_start(vif, RWNX_TXQ_STOP_CHAN, rwnx_hw);
        } else
            rwnx_txq_vif_stop(vif, RWNX_TXQ_STOP_CHAN, rwnx_hw);
        spin_unlock_bh(&rwnx_hw->cb_lock);
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 18, 0))
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef, 0, 0);
#else
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef);
#endif

        //>> mutex_unlock(&vif->wdev.mtx);
        __release(&vif->wdev.mtx);
    }
```

加上两个注释。

#### too few arguments to function ‘cfg80211_ch_switch_notify’

`cfg80211_ch_switch_notify()`参数过少，同样是内核升级导致接口变换，新内核为了支持 WiFi 7 的 MLO 多链路特性，在这类函数中间塞入了一个 `link_id` 参数。对我们普通网卡来说，传 `0` 即可。

原代码：

```c
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 18, 0))
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef, 0);
#else
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef);
#endif
```

修改后：

```c
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 18, 0))
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef, 0, 0);
#else
                cfg80211_ch_switch_notify(vif->ndev, &csa->chandef);
#endif
```

多加了个0。

如果想要代码有可扩展性，可以保留上面内核版本判断条件，自己添加一个6.5.0内核的条件，这里不再赘述（~~能用就行~~）

#### too few arguments to function ‘cfg80211_ch_switch_started_notify’

```
AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_main.c:5455:9: error: too few arguments to function ‘cfg80211_ch_switch_started_notify’
5455 |     cfg80211_ch_switch_started_notify(dev, &csa->chandef, 0, params->count, false);
   |     ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
./include/net/cfg80211.h:8760:6: note: declared here
8760 | void cfg80211_ch_switch_started_notify(struct net_device *dev,
   |   ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

同上面，也是缺少了`link_id`，依旧传入0。

原代码：

```c
#if LINUX_VERSION_CODE >= KERNEL_VERSION(6, 0, 0)
        cfg80211_ch_switch_started_notify(dev, &csa->chandef, 0, params->count, false);
#elif LINUX_VERSION_CODE >= KERNEL_VERSION(5, 11, 0)
        cfg80211_ch_switch_started_notify(dev, &csa->chandef, 0, 0, params->count, params->block_tx);
#else
		cfg80211_ch_switch_started_notify(dev, &csa->chandef, params->count);
#endif
```

修改后：

```c
#if LINUX_VERSION_CODE >= KERNEL_VERSION(6, 0, 0)
        cfg80211_ch_switch_started_notify(dev, &csa->chandef, 0 , 0, params->count, false);
#elif LINUX_VERSION_CODE >= KERNEL_VERSION(5, 11, 0)
        cfg80211_ch_switch_started_notify(dev, &csa->chandef, 0, 0, params->count, params->block_tx);
#else
		cfg80211_ch_switch_started_notify(dev, &csa->chandef, params->count);
#endif
```

注意看第一个if后面加了一个0。

#### cfg80211_beacon_data

```
/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_main.c:6432:22: error: initialization of ‘int (*)(struct wiphy *, struct net_device *, struct cfg80211_ap_update *)’ from incompatible pointer type ‘int (*)(struct wiphy *, struct net_device *, struct cfg80211_beacon_data *)’ [-Werror=incompatible-pointer-types]
6432 |   .change_beacon = rwnx_cfg80211_change_beacon,
   |           ^~~~~~~~~~~~~~~~~~~~~~~~~~~
```

新内核把 `cfg80211_beacon_data` 结构体包裹进了一个更大的 `cfg80211_ap_update` 结构体里。如果直接改里面所有的代码会极其繁琐，我们用一个优雅的 C 语言指针魔法来偷天换日

原代码：

```c
static int rwnx_cfg80211_change_beacon(struct wiphy *wiphy, struct net_device *dev,
                                struct cfg80211_beacon_data *info)
{
    struct rwnx_hw *rwnx_hw = wiphy_priv(wiphy);
    struct rwnx_vif *vif = netdev_priv(dev);
    struct rwnx_bcn *bcn = &vif->ap.bcn;
    struct rwnx_ipc_elem_var elem;
```

修改后：

```c
static int rwnx_cfg80211_change_beacon(struct wiphy *wiphy, struct net_device *dev,
                                       struct cfg80211_ap_update *ap_info)
{
    struct cfg80211_beacon_data *info = &ap_info->beacon;
    struct rwnx_hw *rwnx_hw = wiphy_priv(wiphy);
    struct rwnx_vif *vif = netdev_priv(dev);
    struct rwnx_bcn *bcn = &vif->ap.bcn;
    struct rwnx_ipc_elem_var elem;
```

注意我修改了形参的最后一个，并且在第一行新增了`struct cfg80211_beacon_data *info = &ap_info->beacon;`。

### `aic8800_fdrv/rwnx_mod_params.c`

```
/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_mod_params.c: In function ‘rwnx_custregd’:
/AIC8800/drivers/aic8800/aic8800_fdrv/rwnx_mod_params.c:1711:32: error: ‘REGULATORY_IGNORE_STALE_KICKOFF’ undeclared (first use in this function)
1711 |  wiphy->regulatory_flags |= REGULATORY_IGNORE_STALE_KICKOFF;
   |                ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

 这又是一个 Linux 内核版本更迭的历史遗留问题。`REGULATORY_IGNORE_STALE_KICKOFF` 是旧版内核里用来处理 WiFi 国家/地区射频管制（Regulatory Domain）的一个标志位。但是在 6.8 内核里，官方直接把它从底层代码里删除了。对于我们日常使用来说，我们只求网卡能连上局域网发包抓包，根本不需要去管什么国际射频合规性，所以，最简单粗暴且完全无副作用的解决办法就是直接把报错的代码注释掉。

原代码：

```c
#if LINUX_VERSION_CODE >= KERNEL_VERSION(4, 0, 0)
    if (!rwnx_hw->mod_params->custregd)
        return;

    wiphy->regulatory_flags |= REGULATORY_IGNORE_STALE_KICKOFF;
    wiphy->regulatory_flags |= REGULATORY_WIPHY_SELF_MANAGED;

    rtnl_lock();
```

修改后：

```c
#if LINUX_VERSION_CODE >= KERNEL_VERSION(4, 0, 0)
    if (!rwnx_hw->mod_params->custregd)
        return;

    // wiphy->regulatory_flags |= REGULATORY_IGNORE_STALE_KICKOFF;
    // wiphy->regulatory_flags |= REGULATORY_WIPHY_SELF_MANAGED;

    rtnl_lock();
```

注意！别改错了！这里有两个`wiphy->regulatory_flags |= REGULATORY_IGNORE_STALE_KICKOFF;`，如下这段**不用改**：

```c
#if (LINUX_VERSION_CODE < KERNEL_VERSION(4, 0, 0)) && (LINUX_VERSION_CODE >= KERNEL_VERSION(3, 14, 0))
        // Apply custom regulatory. Note that for recent kernel versions we use instead the
        // REGULATORY_WIPHY_SELF_MANAGED flag, along with the regulatory_set_wiphy_regd()
        // function, that needs to be called after wiphy registration
        memcpy(country_code, default_ccode, sizeof(default_ccode));
		regdomain = getRegdomainFromRwnxDB(wiphy, default_ccode);
        printk(KERN_CRIT
               "\n\n%s: CAUTION: USING PERMISSIVE CUSTOM REGULATORY RULES\n\n",
               __func__);
        wiphy->regulatory_flags |= REGULATORY_CUSTOM_REG;
        wiphy->regulatory_flags |= REGULATORY_IGNORE_STALE_KICKOFF;
        wiphy_apply_custom_regulatory(wiphy, regdomain);
```



