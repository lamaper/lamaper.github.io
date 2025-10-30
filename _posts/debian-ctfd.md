+++
date = '2023-01-26T12:00:00+08:00'
draft = false
title = 'Debian11+CTFd+Docker部署动态靶机（已废弃）'
tags = ['ctf', 'ctfd']
categories = ['ctf']
+++

lamaper@qq.com

## 一、准备工作

### 换源

#### apt换源

存放apt源的配置文件路径为/etc/apt/source.list，首先要对这个配置文件进行备份，备份命令如下。

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
```

 如果需要**恢复原来的配置文件**，只需要用备份的配置文件覆盖原来的配置文件即可，命令如下。

```bash
sudo cp /etc/apt/sources.list.bak /etc/apt/sources.list
```

 使用nano打开source.list文件，命令如下。

```bash
sudo nano /etc/apt/sources.list
```

根据需要进行换源，这里更换为清华大学源：

```bash
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch main non-free contrib
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-updates main non-free contrib
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-backports main non-free contrib
deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch main non-free contrib
deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-updates main non-free contrib
deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-backports main non-free contrib
deb https://mirrors.tuna.tsinghua.edu.cn/debian-security/ stretch/updates main non-free contrib
deb-src https://mirrors.tuna.tsinghua.edu.cn/debian-security/ stretch/updates main non-free contrib
```

#### 安装pip及换源

安装pip

```bash
sudo apt install python3-pip
```

换源

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple pip -U
```

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

安装flask

```bash
sudo pip install flask
```

安装gunicore（后台运行）

```bash
sudo pip install gunicore
```

安装gevent

```bash
sudo pip intsall gevent
```

安装nginx

```bash
sudo apt install nginx
```

安装supervisor

```bash
sudo apt install supervisor
```

#### 安装git

```bash
sudo apt install git
```

#### 安装ssh（可选）

```bash
sudo apt install ssh
```

修改配置文件

### 克隆仓库

下载改写的ctfd，赵师傅已经完成了镜像换源等操作

```bash
sudo git clone https://github.com/glzjin/CTFd.git
```

下方的准备是为了后期开启动态靶机：

下载frp

```bash
wget https://github.com/fatedier/frp/releases/download/v0.29.0/frp_0.29.0_linux_amd64.tar.gz

tar -zxvf frp_0.29.0_linux_amd64.tar.gz
```

下载ctf-whale

```bash
sudo git clone https://github.com/glzjin/CTFd-Whale.git
```

下载docker的frps

```bash
sudo git clone https://github.com/glzjin/Frp-Docker-For-CTFd-Whale.git
```

## 二、运行服务

进入ctfd目录

```bash
cd CTFd-master
```

### 安装依赖

```bash
chmod 777 prepare.sh
vim prepare.sh 
pip install -r requirements.txt -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com 
./prepare.sh
```

### 通过nohup守护gunicorn进程先开启服务

```bash
nohup gunicorn --bind 0.0.0.0:8000 -w 9 --worker-class="gevent" "CTFd:create_app()"#w表示进程数，建议 cpu核心数*2+1
```

### 部署nginx代理

```bash
cd /etc/nginx/sites-enabled/
```

```bash
rm default
```

新建ctfd.conf文件并修改

```bash
nano ctfd.conf
```

```bash
server { 
 listen 80; 
 server_name 10.0.90.10; #对外IP
 access_log /var/log/nginx/access.log;
 error_log /var/log/nginx/error.log;
 charset utf-8;
 location / {
  proxy_pass http://127.0.0.1:8000; # 转发的地址，即Gunicorn运行的地址
  proxy_redirect off;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
            }
 location /themes/core/static { # 处理静态文件夹中的静态文件
  alias /var/www/html/CTFd-master/CTFd/themes/core/static;
  expires 5m; # 设置缓存过期时间
                               }
  location /themes/admin/static { # 处理静态文件夹中的静态文件
  alias /var/www/html/CTFd-master/CTFd/themes/admin/static;
  expires 5m; # 设置缓存过期时间
                                 }
       }
```

最后运行如下命令

```bash
nginx -t 测试配置文件是否正确

ln -s /etc/nginx/sites-enabled/ctfd.conf /etc/nginx/sites-available/ctfd.conf

netstat -4anep|grep 80

systemctl stop apache2 #关闭其他占用80端口的进程

systemctl restart nginx
```

返回ctfd目录

```bash
cd CTFd-master
```

### 配置后台监视程序

```bash
nano /etc/supervisor/conf.d/ctfd.conf

[program:ctfd]
command=/usr/local/bin/gunicorn --bind 0.0.0.0:8000 -w 9 --worker-class="gevent" "CTFd:create_app()"
directory=/var/www/html/CTFd-master #项目目录
user=root
autorestart=true #设置随supervisor服务自动重启
startretires=3 #重启失败3次
```

## 三、配置服务

进入http://<服务器地址>:8000，对ctfd后台进行配置

"172.19.0.2/16"