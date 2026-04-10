---
title: 我的世界服务器离线模式被攻击引发的思考
description: Minecraft1.21.1
author: lamaper
date: 2026-03-17 13:40:21 +0800
categories: [Cyber Security, Tinkering]
tags: [minecraft, java]
math: true
mermaid: true
toc: true
render_with_liquid: true#
---

## 发生甚摸事了

朋友的服务器被低调的黑客gank了，在里面生成了12000个凋零，出于好奇，我要来了日志，看看发生什么事了。

2026年3月17日的深夜：

```toml
[22:26:57] [Server thread/INFO]: Oobl****[/101.*.***.**:4****] logged in with entity id 2187341 at (-902.2267610502333, 102.0, 104.89983738940552)
[22:26:57] [Server thread/INFO]: Oobl**** joined the game
[22:26:58] [Server thread/INFO]: Syncmatica client joining with local version 0.3.14-sakura.5 and client version 0.3.14-sakura.5
[22:26:58] [Server thread/INFO]: Player Oobl**** joined with a matching carpet client
[22:54:31] [Server thread/INFO]: Oobl**** lost connection: Disconnected
[22:54:31] [Server thread/INFO]: Oobl**** left the game
[23:01:00] [Server thread/INFO]: Oobl****[/101.*.***.**:53641] logged in with entity id 2192978 at (-902.6896343830997, 100.0, 124.90821564991063)
[23:01:00] [Server thread/INFO]: Oobl**** joined the game
[23:01:00] [Server thread/INFO]: Syncmatica client joining with local version 0.3.14-sakura.5 and client version 0.3.14-sakura.5
[23:01:01] [Server thread/INFO]: Player Oobl**** joined with a matching carpet client
[23:09:17] [Server thread/INFO]: h***t[/183.***.**.***:64435] logged in with entity id 2195675 at (-473.03686292786534, 182.5, -1191.2888475829097)
[23:09:17] [Server thread/INFO]: h***t joined the game
[23:09:18] [Server thread/INFO]: Syncmatica client joining with local version 0.3.14-sakura.5 and client version 0.3.14-sakura.5
[23:09:19] [Server thread/INFO]: Player h***t joined with a matching carpet client
[23:20:26] [Server thread/INFO]: h***t fell from a high place
[23:29:46] [Server thread/INFO]: Villager class_1646['Villager'/2190740, l='ServerLevel[world]', x=-955.96, y=64.00, z=159.42] died, message: 'Villager was slain by Zombie'
[23:37:45] [Server thread/INFO]: 6[local] logged in with entity id 2220547 at (-902.9699197540052, 79.0, 101.45477789741008)
[23:37:45] [Server thread/WARN]: User e23e3ad2-2a90-33d6-9d94-204200b75fe9 - 6 doesn't currently have data pre-loaded - denying login.
[23:37:45] [Server thread/INFO]: 6 joined the game
[23:40:53] [Server thread/INFO]: Oobl**** was impaled by sxd
[23:40:54] [Server thread/WARN]: Oobl**** moved too quickly! -137.53032285627614,3.4696933728289636,-134.79221592850183
[23:41:02] [Server thread/INFO]: h***t was slain by Drowned
[23:41:04] [Server thread/WARN]: h***t moved too quickly! -85.80837401402266,8.350073344632207,-23.64951039706426
[23:44:51] [Server thread/INFO]: Oobl**** lost connection: Disconnected
[23:44:51] [Server thread/INFO]: Oobl**** left the game
[23:47:53] [Server thread/INFO]: Oobl****[/101.*.***.**:49678] logged in with entity id 2223872 at (-903.3000000119209, 79.0, 102.80824830277805)
[23:47:53] [Server thread/INFO]: Oobl**** joined the game
[23:47:53] [Server thread/INFO]: Syncmatica client joining with local version 0.3.14-sakura.5 and client version 0.3.14-sakura.5
[23:47:54] [Server thread/INFO]: Player Oobl**** joined with a matching carpet client
[23:48:13] [Server thread/INFO]: Oobl**** lost connection: Disconnected
[23:48:13] [Server thread/INFO]: Oobl**** left the game
[23:52:43] [Server thread/INFO]: Oobl****[/101.*.***.**:49854] logged in with entity id 2224989 at (-901.5667958138159, 63.0, 164.86854711694332)
[23:52:43] [Server thread/INFO]: Oobl**** joined the game
[23:52:43] [Server thread/INFO]: Syncmatica client joining with local version 0.3.14-sakura.5 and client version 0.3.14-sakura.5
[23:52:45] [Server thread/INFO]: Player Oobl**** joined with a matching carpet client
[23:53:28] [Server thread/INFO]: [Not Secure] <Oobl****> -902 105
[23:54:07] [Server thread/INFO]: [Not Secure] <Oobl****> -113 13
```

我朋友Oobl\*\*\*\*正在愉快的和朋友开黑，可以看到他的IP是`101.*.***.**`，他的朋友h\*\*\*t的IP是`183.***.**.***`，此时十分和谐，没有任何事情发生。

2026年3月18日凌晨：

```toml
[00:43:42] [Server thread/INFO]: Oobl**** lost connection: Disconnected
[00:43:42] [Server thread/INFO]: Oobl**** left the game
[00:53:40] [Server thread/INFO]: 1 was slain by Magma Cube
[00:53:40] [Server thread/INFO]: 1 lost connection: 1 died
[00:53:40] [Server thread/INFO]: 1 left the game
[01:20:37] [Server thread/INFO]: Disconnecting CheonMa21 (/185.183.34.42:43366): You are not white-listed on this server!
[01:20:37] [Server thread/INFO]: CheonMa21 (/185.183.34.42:43366) lost connection: You are not white-listed on this server!
[01:20:37] [Server thread/WARN]: H****eDisconnection() called twice
[01:26:46] [Server thread/INFO]: h***t[/185.183.34.42:55509] logged in with entity id 2291587 at (-748.7753401731082, 70.0, 297.6214450098004)
[01:26:46] [Server thread/INFO]: h***t joined the game
[01:27:12] [Server thread/INFO]: h***t lost connection: Disconnected
[01:27:12] [Server thread/INFO]: h***t left the game
[01:28:22] [Server thread/INFO]: H****e[/185.183.34.42:20258] logged in with entity id 2293129 at (-819.4166226422064, 63.0, 301.36735890052597)
[01:28:22] [Server thread/INFO]: H****e joined the game
[01:28:43] [Server thread/INFO]: H****e lost connection: Disconnected
[01:28:43] [Server thread/INFO]: H****e left the game
[01:28:54] [Server thread/INFO]: Oobl****[/185.183.34.42:41176] logged in with entity id 2293726 at (-92.21091586782573, 129.0, 32.23059529534109)
[01:28:54] [Server thread/INFO]: Oobl**** joined the game
[01:29:14] [Server thread/INFO]: [Oobl****: Set own game mode to Creative Mode]
[01:30:34] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:30:34] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:30:49] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:30:49] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:07] [Server thread/INFO]: Oobl**** has made the advancement [Ol' Betsy]
[01:34:35] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:35] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:35] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:35] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/1367853, l='ServerLevel[world]', x=-913.30, y=87.00, z=108.30] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/1367879, l='ServerLevel[world]', x=-910.30, y=100.00, z=117.30] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/1367884, l='ServerLevel[world]', x=-910.30, y=100.00, z=117.30] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/1367885, l='ServerLevel[world]', x=-910.70, y=100.00, z=117.30] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/2140801, l='ServerLevel[world]', x=-889.70, y=100.00, z=114.70] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/2156210, l='ServerLevel[world]', x=-889.70, y=100.00, z=114.30] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Villager'/2172626, l='ServerLevel[world]', x=-889.70, y=100.00, z=114.30] died, message: 'Villager blew up'
[01:34:36] [Server thread/INFO]: Villager class_1646['Librarian'/1367777, l='ServerLevel[world]', x=-840.50, y=63.00, z=253.70] died, message: 'Librarian blew up'
[01:34:37] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:37] [Server thread/INFO]: [Arrow: Summoned new Fireball]
[01:34:37] [Server thread/INFO]: [Arrow: Summoned new Fireball]
```

神秘的事情发生了。0点43分我朋友下号之后，一个来自`185.183.34.42`的神秘人士开始尝试以`CheonMa21`的ID登录服务器，然而由于服务器开启了白名单功能，结果并未如他意愿。于是这位神秘人士不知道以什么手段，居然获得了这个服务器其他玩家的用户名信息，并开始伪造他们的身份登录，首先是h\*\*\*t和H\*\*\*\*e，估计是发现没有OP权限，这个神秘人士最终选择Oobl\*\*\*\*的用户名登录，发现有OP后就开始为所欲为。

我们可以看到明显地对比：

```toml
[23:47:53] [Server thread/INFO]: Oobl****[/101.*.***.**:49678] logged in with entity id 2223872 at (-903.3000000119209, 79.0, 102.80824830277805)

[01:28:54] [Server thread/INFO]: Oobl****[/185.183.34.42:41176] logged in with entity id 2293726 at (-92.21091586782573, 129.0, 32.23059529534109)
```

```toml
[23:09:17] [Server thread/INFO]: h***t[/183.***.**.***:64435] logged in with entity id 2195675 at (-473.03686292786534, 182.5, -1191.2888475829097)

[01:26:46] [Server thread/INFO]: h***t[/185.183.34.42:55509] logged in with entity id 2291587 at (-748.7753401731082, 70.0, 297.6214450098004)
```

## 为啥会这样

