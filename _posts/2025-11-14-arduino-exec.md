---
title: 制造技术基础训练D——机器人创意实践
description: 记一次全天的“金工实习”
author: lamaper
date: 2025-11-14 17:19:21 +0800
categories: [Blogs]
tags: [hardware, arduino, study-in-BIT]
math: true
mermaid: true
toc: true
render_with_liquid: true
image:
  path: /assets/img/post/arduino-exec/01.jpg
---
# 机器人创意实践

早八工训楼谁受得了，偏偏让我们碰上了，一上就上一天，8:00-16:55一秒不耽误。

整个实习过程都是围绕展开，机械部分没看出来用得什么器材，硬件使用Basra Arduino开发板与BigFish扩展版。

一开始就是按照电脑上的PPT开始超级拼装，有很多细节需要注意，尤其是安装电机的时候。老师查验完之后会下发开发板和蓝牙模块。最终任务就是进行机器人抢球大赛，允许使用舵机构建一个铲子把场地中的球、方块放到指定的有围挡的区域。

四人为一小组来展开实验，老师很逆天地按学号分组，但也很幸运地遇到了全场最佳机械师和全场最佳操作员，最后我们以4分夺得冠军，算是完美收官。

## 成果展示

![](/assets/img/post/arduino-exec/02.jpg)

![img](/assets/img/post/arduino-exec/01.jpg)

## 代码展示
```cpp
#include <Servo.h>

int ANGEL = 1;
Servo servo_pin;

void setup(){
    pinMode(5, OUTPUT);
    pinMode(6, OUTPUT);
    pinMode(9, OUTPUT);
    pinMode(10, OUTPUT);
    servo_pin.attach(3);
    Serial.begin(9600);
}    

void loop(){
    bluetooth();
}


void bluetooth(){
    if(Serial.available() > 0){
        char cmd = Serial.read();
        switch(cmd){
            case 'F':
              _forward();
              break;
            case 'B':
              _backward();
              break;
            case 'L':
              _turn_left();
              delay(150);
              _stop();
              break;
            case 'R':
              _turn_right();
              delay(150);
              _stop();
              break;
            case 'S':
              _stop();
              break;
            case 'N':
              _turn();
              break;
            case 'S':
              _stop();
              break;
            case 'U':
              _up();
              break;
            case 'D':
              _down();
              break;
        }
    }
}

void _up(){
    if(ANGEL < 210)ANGEL+=10;
    servo_pin.write( ANGEL );//舵机角度
}
void _down(){
    if(ANGEL > 10)ANGEL-=10;
    servo_pin.write( ANGEL );
}

void _forward(){
  digitalWrite( 5 , HIGH );
  digitalWrite( 6 , LOW );
  digitalWrite( 9 , HIGH );
  digitalWrite( 10 , LOW );
  
}

void _stop(){
  digitalWrite( 5 , LOW );
  digitalWrite( 6 , LOW );
  digitalWrite( 9 , LOW );
  digitalWrite( 10 , LOW );

}

void _backward(){
  digitalWrite( 5 , LOW );
  digitalWrite( 6 , HIGH );
  digitalWrite( 9 , LOW );
  digitalWrite( 10 , HIGH);
}
void _turn_right(){
  digitalWrite( 5 , LOW );
  digitalWrite( 6 , LOW );
  digitalWrite( 9 , HIGH );
  digitalWrite( 10 , LOW );
}
void _turn_left(){
  digitalWrite( 5 , HIGH );
  digitalWrite( 6 , LOW );
  digitalWrite( 9 , LOW );
  digitalWrite( 10 , LOW);
}
void _turn(){
  digitalWrite( 5 , HIGH );
  digitalWrite( 6 , LOW );
  digitalWrite( 9 , LOW );
  digitalWrite( 10 , HIGH);
}
```
## 相关资料下载
课件：已上传至BIT101 Onedrive，位于【制造技术基础训练D】，课程编号：100031315，
<a class="btn btn-primary" href="https://onedrive.bit101.cn/api/raw/?path=/course/%E5%88%B6%E9%80%A0%E6%8A%80%E6%9C%AF%E5%9F%BA%E7%A1%80%E8%AE%AD%E7%BB%83D-100031315/ppt/%E5%88%B6%E9%80%A0%E6%8A%80%E6%9C%AF%E5%9F%BA%E7%A1%80%E8%AE%AD%E7%BB%83D-%E6%9C%BA%E5%99%A8%E4%BA%BA%E5%88%9B%E6%84%8F%E5%AE%9E%E8%B7%B5.pdf" download>⬇️ 下载文件</a>

操控软件：Arduino Bluetooth Controller，使用这个软件是因为老师给的软件实在太老，在部分手机上即使正常安装也无法正常运行，所以选用一个新软件，亲测可用，<a class="btn btn-primary" href="https://appinventor-ai-a0989675377-esp32.cn.uptodown.com/android" download>⬇️ 下载文件</a>。需要注意的是，这个下载地址是uptodown.com，我在官网并没有找到下载地址。



