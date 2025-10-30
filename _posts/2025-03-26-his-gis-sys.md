---
title: 史纲课展示——第一次鸦片战争GIS
description: 近代史刚要的课程大作业，一段奇妙的回忆
author: lamaper
date: 2025-03-26 19:20:00 +0800
categories: [Blogs]
tags: [arcgis, web]
math: true
mermaid: true
---
为了能在史纲课上拿到不错的平时分，我们小组揭榜挂帅选了一个比较有挑战性任务——制作第一次鸦片战争GIS系统。

由于老师希望实现网页端的交互，导致了我们无法使用ArcGIS Pro进行任务，从而转向有qgis2web插件的QGIS。然而好景不长，QGIS的插件不能完全做到所见即所得，虽然其很高端，能够实现炫酷的操作与交互，因而最后我们又回归ArcGIS Pro，最终方案为：ArcGIS生成合适的地图图片，再使用前端工具对图片进行标注。

### 一、数据选择

虑到我们要制作的GIS是针对1840年的，现有地图显然不能支持我们完成这项任务。哈佛大学的[CHGIS v6](https://chgis.fas.harvard.edu/data/chgis/v6/)很好的解决了我们的问题，在其[官方数据库](https://dataverse.harvard.edu/dataverse/chgis_v6_1820)下载`v6_1820_pref_pgn_utf`（市一级行政区边界），`v6_1820_pref_pts_utf`（市一级行政区中心），`v6_1820_prov_pgn_utf`（省一级行政区边界），然后将这些包导入到ArcGIS中即可。

![ArcGIS01.jpg](https://img.picui.cn/free/2025/03/11/67d0117ef3f7a.jpg)

![ArcGIS02.png](https://img.picui.cn/free/2025/03/11/67d0117dc8866.png)

![ArcGIS03.png](https://img.picui.cn/free/2025/03/11/67d0117fc5382.png)

需要注意的是，在我使用的ArcGIS中，utf编码的地图会产生乱码，建议下载gbk编码的版本。

### 二、整体构思

设计思路是将视图分为左右两个板块，左边为地图，右边为文本。

```
--/
---index.html
---PaoTai.html

---/assets

----/image

---/misc

---/scripts
----main.js
----paotai.js

---/styles
----main.css
----paotai.css
```

### 三、框架搭建

为了能够轻便运行，我放弃了VUE、NodeJS、flask等需要服务端的框架，转而使用轻量级的`html+js+css`完成网页搭建。

感谢伟大的大语言模型deepseek的大力支持，让我在一周不到的时间里完成这个项目。

在index.html中，我们首先对网页视图进行简单划分区域：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>第一次鸦片战争动态展示</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <div class="container">
        <div class="map-container">
           
        </div>

        <div class="info-panel">
           
        </div>

    <script src="scripts/data.js"></script>
    <script src="scripts/main.js"></script>
    </div> 
</body>
</html>
```

可以看到在container中，我把视图分为两个区域：`map-containe`和`info-panel`，前者负责展示地图和实现交互操作，后者负责展示内容。

内容很好生成，只需要把想要放进去的文本交给大语言模型，让其转化为html即可：

```html
<div class="info-panel">
            <h1>第一次鸦片战争</h1>
        
            <div class="history-article">
                <img src="https://b0.bdstatic.com/ugc/VD9q43Rh9rv2_28-4BKoTQb756ae0e7ac773ee593fb8c2e0545a07.jpg@h_1280" alt="鸦片战争形势图" class="article-main-img">
                <div class="article-section">
                    <h2>1. 战前准备：</h2>
                    <h3>背景：</h3>
                    <p>（1）中英贸易体制冲突：</p>
                    <p>英国不断开拓海外市场，倾销商品。清政府通过行商制度垄断对外贸易，英国贸易受限。1834年英国派律劳卑任商务监督，试图突破行商体系直接交涉。律劳卑以非“禀”格式信件致广州高官，遭清政府拒绝，卢坤总督还发布命令，要求英商活动后立即返澳门。此事件凸显中英在外交文书格式、官方接触方式上的矛盾，英国对既有贸易体制的不满进一步加剧。</p>
        
                    ......
            </div>
        
            <div class="history-article">
                ......
            </div>
        </div>
```

左侧的地图就更加简单，直接添加图片即可：

```html
<div class="map-container">
            <!-- <div class="map-image" id="warMap"></div> -->
            <div class="map-image">
                <!-- 添加img标签以获取实际渲染尺寸 -->
                <img src="assets/images/qing-dynasty-map.jpg" 
                     alt="历史地图" 
                     style="width: 100%; height: auto; opacity: 0;"> 
            </div>
        </div>
```

如此，基本的网页框架就搭建完毕了。

### 四、细节实现

#### （一）样式设计

在`styles/main.css`中来实现具体的样式，首先对网页大体进行设计：

```css
body {
    margin: 0;
    font-family: 'Microsoft YaHei', sans-serif;
}

.container {
    display: flex;
    height: 100vh;
}

.map-container {
    flex: 6.5;
    position: relative;
    background: #f0f0f0;
}

.map-image {
    position: relative;  /* 关键定位设置 */
    width: 100%;
    height: 90vh;
    background: url('../assets/images/qing-dynasty-map.jpg') no-repeat center/contain;
}

.info-panel {
    flex: 3.5;
    padding: 20px;
    overflow-y: auto;
    background: #fff;
    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}
```

在`map-container`和`info-panel`中分别定义`flex`属性，使其做到6.5:3.5的视图占比，紧接着设计一下背景颜色和阴影部分。

之后实现`info-panel`中多样化的字体样式与图文混排：

```css
.history-article {
    padding: 20px;
    line-height: 1.8;
}

.info-panel {
    flex: 3.5;
    padding: 20px;
    overflow-y: auto;
    background: #fff;
    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}

.info-panel h1 {
    text-align: center;
    font-size: 2.2em;
    color: #2c3e50;
    margin-bottom: 25px;
    border-bottom: 3px solid #3498db;
    padding-bottom: 15px;
}

.article-section h2 {
    color: #34495e;
    font-size: 1.3em;
    margin: 25px 0 15px;
    padding-left: 10px;
    border-left: 4px solid #e74c3c;
}

/* 图文混排 */
.article-main-img {
    width: 100%;
    border-radius: 8px;
    margin: 15px 0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.article-sub-img {
    width: 90%;
    margin: 15px auto;
    display: block;
    border: 1px solid #ddd;
}
```

#### （二）鼠标悬停信息展示交互

为了可视化地展示第一次鸦片战争中一些关键战役点的信息，我们要在地图上绘制一些可交互的点，这需要依靠JavaScript。

在main.js中，实现这个功能；而在data.js中，存储着需要画图的信息。

```javascript
// data.js
const warEvents = [
    {
        id: 1,
        title: "虎门销烟",
        position: { x: "42%", y: "73%" },
        color: "#e74c3c",
        time: "1839年6月3日-25日",
        url: "",
        significance: `林则徐在东莞虎门海滩当众销毁鸦片237万斤，历时23天。这是清政府首次大规模禁烟行动，直接导致中英贸易冲突升级[6] 。`
    },
    {
        id: 2,
        title: "林维喜案",
        position: { x: "45%", y: "75%" },
        color: "#f1c40f",
        time: "1839年7月7日",
        url: "",
        significance: `英国水手在九龙尖沙咀打死村民林维喜，成为中英司法冲突的导火索。该事件暴露领事裁判权问题，加速战争爆发[6] 。`
    },
    {
        id: 3,
        title: "定海战役",
        position: { x: "60%", y: "52%" },
        color: "#2ecc71",
        time: "1840年7月5日-6日",
        url: "",
        significance: `英军首次攻占中国沿海城市，标志战争从广东扩展到江浙。清军26人阵亡，知县姚怀祥投水殉国[6] 。\n英军占据舟山后的疾病蔓延、人员被擒及谈判博弈。英军占领舟山后，因食物不足、卫生条件差，疾病（间歇热、痢疾）肆虐。士兵住城外营地，大米质量差，腌肉减量，医院设于潮湿稻田旁，康复困难。9月初，马德拉斯炮兵安突德上尉调查时被中方人员抓获，押往宁波，关入木笼。9月15日，“风鸢”号搁浅遭中方炮击，副航海长吉布生等被抓押至宁波，部分船员被小船接走。“康威”号、“阿尔吉林”号活动中，“康威”号船员患坏血病，“阿尔吉林”号遭炮台炮击，梅森上尉指挥回击。伯麦爵士就安突德被抓致信中方未果。10月英军回舟山，得知情况后谈判，中方承诺宽大处理俘虏，英军后续撤离舟山。英军因疾病、补给问题战力下降，清政府通过抓获英军在谈判中占据主动，促使英军寻求谈判，为后续停战协议奠定基础。此阶段暴露英军占领舟山后的统治困境，也体现清政府局部抵抗与外交博弈策略。`
    },
    {
        id: 4,
        title: "大沽口谈判",
        position: { x: "52%", y: "18%" },
        color: "#9b59b6",
        time: "1840年8月",
        url: "",
        significance: `第一次鸦片战争期间仅有少量老式炮台（约60门炮），未形成有效防御。英军于1840年8月抵大沽口威胁清廷，迫使道光帝求和，清政府首次与英方正式谈判。暴露清廷对海防认知的严重不足[6] 。`
    },
    {
        id: 5,
        title: "虎门战役",
        position: { x: "41%", y: "75%" },
        color: "#e74c3c",
        time: "1841年1月7日",
        url: "./PaoTai.html",
        significance: `英军使用蒸汽战舰侧翼包抄战术，清军传统炮台失效。水师提督关天培殉国，舰船损失比11:0[6] 。`
    },
    {
        id: 6,
        title: "三元里抗英",
        position: { x: "45%", y: "71%" },
        color: "#3498db",
        time: "1841年5月30日",
        url: "",
        significance: `民间自发抗英最大规模战斗，利用暴雨使英军燧发枪失效，毙伤敌72人。展现民众抵抗意志[6] 。`
    },
    {
        id: 7,
        title: "南京条约签订",
        position: { x: "58%", y: "40%" },
        color: "#e67e22",
        time: "1842年8月29日",
        url: "",
        significance: `中国近代第一个不平等条约，主要内容：割让香港岛、赔款2100万银元、五口通商。标志战争正式结束[6] 。`
    },
    {
        id: 8,
        title: "厦门之战",
        position: { x: "52.5%", y: "68%" },
        color: "#e67e99",
        time: "1840年7月",
        url: "",
        significance: `地势与防御：厦门坐落在厦门岛南岸，与鼓浪屿隔海峡相望，海峡两侧地势高，厦门城南山峦为天然屏障，沿岸及鼓浪屿遍布炮台，防御工事较坚固。
战斗细节：英军“布朗底”号等舰船进犯厦门，中方炮台反击。但英军舰船机动性强，武器先进，持续炮击摧毁厦门部分炮台。清军虽依托工事抵抗，终因武器差距（英军步枪射程、射速占优）失利，厦门部分区域被占领。此役展现英军沿海进攻态势，扩大战争范围。`
    }
];
```

这些机械性内容完全可以交由大语言模型来帮忙填充。需要注意的是，这里的`position`是我个人手动调整的，在我的电脑上能够完美对应地图上的点，但是在别的尺寸的屏幕上会有偏移，具体原因会在后文提到。

这一段交由大语言模型实现：

```javascript
function createInfoWindow() {
    const infoWindow = document.createElement('div');
    infoWindow.id = 'event-info';
    infoWindow.style.cssText = `
        position: fixed;
        background: rgba(255,255,255,0.96);
        padding: 12px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 280px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        z-index: 9999;
        font-family: 'Microsoft YaHei', sans-serif;
    `;
    document.body.appendChild(infoWindow);
    return infoWindow;
}

const infoWindow = createInfoWindow();

// 信息窗显示逻辑
function showEventInfo(event, marker) {
    const rect = marker.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    infoWindow.innerHTML = `
        <div style="border-bottom: 1px solid #eee; margin-bottom:8px; padding-bottom:4px;">
            <strong style="font-size:16px; color:#2c3e50;">${event.title}</strong>
        </div>
        <div style="font-size:13px; color:#666;">
            <div style="margin-bottom:6px;">🕒 ${event.time}</div>
            <div>${event.significance}</div>
        </div>
    `;

    // 动态计算位置防止溢出
    const windowWidth = window.innerWidth;
    let posLeft = rect.left + rect.width/2;
    if(posLeft > windowWidth - 300) posLeft = windowWidth - 300;
    
    infoWindow.style.left = `${posLeft}px`;
    infoWindow.style.top = `${rect.top + scrollY + 24}px`;
    infoWindow.style.opacity = '1';
}
```

首先实现动态绘图，依照`data.js`的内容，定义一个展示框及其样式。

然后实现动态绘图：

```javascript
// 增强版标记初始化
// 修改后的标记初始化函数（保留悬停提示，增加点击跳转）
function initMapMarkers() {
    const mapContainer = document.querySelector('.map-image');
    
    mapContainer.querySelectorAll('.event-marker').forEach(marker => marker.remove());
    
    warEvents.forEach(event => {
        const marker = document.createElement('div');
        marker.className = 'event-marker';
        marker.style.cssText = `
            left: ${event.position.x};
            top: ${event.position.y};
            background-color: ${event.color};
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            cursor: ${event.url ? 'pointer' : 'default'};
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        marker.dataset.eventId = event.id;

        // 保留悬停显示信息窗功能
        marker.addEventListener('mouseenter', () => {
            showEventInfo(event, marker);
            marker.style.transform = 'translate(-50%, -50%) scale(2)';
        });

        marker.addEventListener('mouseleave', () => {
            infoWindow.style.opacity = '0';
            marker.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // 点击跳转逻辑
        marker.addEventListener('click', () => {
            if(event.url) {
                // 新标签页打开（保留当前页面状态）
                window.open(event.url, '_blank');
            }
        });

        mapContainer.appendChild(marker);
    });
}


// 统一初始化
function initializeApp() {
    const mapContainer = document.querySelector('.map-image');
    initMapMarkers();
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeApp);
```

到此，网站的绝大部分内容就实现了。

#### （三）鸦片战争动态展示

为了实现鸦片战争的动态展示，一开始我希望也通过JavaScript来实现，但是在咨询过淘宝的外包人员以后，得到的答复是比较难实现（要加钱），因而我也没有办法在一周内就实现这样的效果。

但是人生就是一场面向结果的编程，只要能实现结果，可以不考虑过程。

如何将鸦片战争的动态展示转移到我的舒适圈？于是我脑洞大开，仔细一想，如果能使用PPT自带的平滑过渡效果，就能很快实现这个功能，那么接下来我的任务实际上就是：用PPT绘制鸦片战争动态过程，然后把其转化为网页元素。

前者十分好实现，Office也算是老朋友了，不到十分钟结束战斗。但问题是如何把PPT转化为**可交互**的网页元素。直接另存为html显然不可行，我的核心诉求就是保留ppt的平滑过度效果。天不亡我，我找到了[课件制作软件_交互式课件_scorm课件_iSpring Suite官方正版](https://www.ispring.cn/ispring-suite)，借助这个强大的工具，可以将带动画的ppt以web形式发布，解决了我的痛点（14天的试用期在ddl为7天的时候显得苍白无力）。

接下来我直接把生成的文件放到`/misc`目录下，然后在`index.html`中添加一个指向它的按钮就可以完美实现我的需求：

```html
<a href="misc/index.html" 
class="control-btn" 
target="_blank">播放战争进程</a>
```

之后实现一下对应的css样式就可以完美结束战斗：

```css
.control-btn {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 30px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
}

.control-btn:hover {
    background: #2980b9;
}
```

