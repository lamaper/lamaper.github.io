+++
date = '2024-10-29T19:25:03+08:00'
draft = false
title = 'GitHubPages + Hugo博客搭建记录（2）'
tags = ['blogs', 'hugo']
categories = ['blogs']
+++

#### hugo.toml与config.toml

在查找资料的过程中，我发现绝大多数博客和文章中，都会提到`config.toml`，但是在我的实际操作中，并没有遇到这个文件，整个项目目录中，只有`hugo.toml`。实际上，经过个人观察，这两个文件的功能应该是一样的。

#### 更换主题报错

之后在更换主题的过程中，我遇到了一个报错：

```bash
 Error: Error building site: TOCSS: failed to transform "scss/style.scss" (text/x-scss). Check your Hugo installation; you need the extended version to build SCSS/SASS. 6:06:59 PM: Total in 5416 ms 6:06:59 PM:
```

导致这个问题的原因是，该主题用到scss，即安装的hugo版本有误，应当下载的是extended版本.所以正确的下载地址应该是[hugo_extended_0.136.5_windows-amd64.zip](https://github.com/gohugoio/hugo/releases/download/v0.136.5/hugo_extended_0.136.5_windows-amd64.zip)，在下载完毕之后，替换原来的`hugo.exe`，这样问题就得到了解决。

这个问题的参考文献：[Hugo构建错误](https://www.jianshu.com/p/d722cc018998)

#### 添加分类归档

本来是要添加【分类归档】和【标签】两个功能，但是今天想了半天只实现了一个。

首先是在`\content`目录下新建目录categories，并且创建_index.md文件，在里面书写：

```markdown
+++
title =  "分类归档"
type = "taxonomy"
layout = "categories"
+++
```

然后回到根目录修改`hugo.toml`，添加以下内容：

```toml
[taxonomies]
  tag = "tags"
  category = "categories"

[markup] 
  [markup.tableOfContents] 
  startLevel = 1 
  endLevel = 3
```

最后需要修改前端显示，由于我对css等前端知识并不熟悉，这段内容交给了AI来实现。

首先切换到当前使用的主题的目录下，找到`layouts/_default/list.html`，修改为以下内容：

```html
{{ define "main" }}
  <article>
    <aside>
      <h2>分类归档</h2>
      <ul class="taxonomy-list">
        {{ range .Site.Taxonomies.categories }}
          <li>
            <a href="{{ .Page.Permalink }}">{{ .Page.Title }}</a>
            <ul>
              {{ range .Pages }}
                <li><a href="{{ .Permalink }}">{{ .Title }}</a></li>
              {{ end }}
            </ul>
          </li>
        {{ end }}
      </ul>
    </aside>

    {{ with .Title -}}
      <h1>文章列表</h1>
    {{- end }}
    {{ with .Content -}}
      <div class="post-content">{{- . -}}</div>
    {{- end }}

    <ul class="posts-list">
      {{ range where .Paginator.Pages "Type" "!=" "page" }}
        <li class="posts-list-item">
          <a class="posts-list-item-title" href="{{ .Permalink }}">{{ .Title }}</a>
          <span class="posts-list-item-description">
            {{ partial "icon.html" (dict "ctx" $ "name" "calendar") }}
            {{ .PublishDate.Format "Jan 2, 2006" }}
            <span class="posts-list-item-separator">-</span>
            {{ partial "icon.html" (dict "ctx" $ "name" "clock") }}
            {{ .ReadingTime }} min read
          </span>
        </li>
      {{ end }}
    </ul>
    {{ partial "pagination.html" $ }}
  </article>
{{ end }}

```

最后添加一些CSS样式，虽然我没看出来这些东西有啥用，但是以防万一，先加上吧。这个文件位置是`static/css/styles.css`:

```css
.taxonomy-list {
  list-style-type: none;
  padding: 0;
}

.taxonomy-list li {
  margin: 5px 0;
}

.taxonomy-list li a {
  text-decoration: none;
  color: #333;
}

.taxonomy-list li a:hover {
  text-decoration: underline;
}

```

参考文献:[hugo官方文档](https://gohugo.io/content-management/taxonomies/)