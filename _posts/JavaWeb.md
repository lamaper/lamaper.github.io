# JavaWeb及相关技术笔记



## Java

### Maven

[Welcome to Apache Maven – Maven](https://maven.apache.org/)

配置本地仓库

```xml
<localRepository>./mvn_repo</localRepository>
```

添加国内源

```xml
<mirror>
      <id>aliyunmaven</id>
      <mirrorOf>*</mirrorOf>
      <name>阿里云公共仓库</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
```

加入环境变量

之后配置IntelliJ IDEA，在`Settings/Build, Execution, Deployment/Build Tools/Maven`中设置Maven地址为本地地址，配置文件为`maven/conf/settings.xml`即可。

注意要将`Settings/Build, Execution, Deployment/Build Tools`中的Reload project after changes in the build script打开并选择Any changes

### Spring

