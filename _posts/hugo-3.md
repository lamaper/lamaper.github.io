+++
date = '2024-10-30T12:04:12+08:00'
draft = false
title = 'GitHubPages + Hugo博客搭建记录（3）'
tags = ['blogs', 'hugo']
categories = ['blogs']
+++

今天魔改了一下主题，主要是添加了归档卡片等东西，学习了一些CSS和前端模版渲染。

list.html

```html
{{ define "main" }}
  <article>
    <aside>
      <h2>分类归档</h2>
      <div class="categories-archive">
        {{ range .Site.Taxonomies.categories }}
          <div class="category-card">
            <a class="category-title" href="{{ .Page.Permalink }}">{{ .Page.Title }}</a>
            <ul class="category-posts">
              {{ range first 5 .Pages }}
                <li><a href="{{ .Permalink }}">{{ .Title }}</a></li>
              {{ end }}
            </ul>
          </div>
        {{ end }}
      </div>
    </aside>
    {{ with .Title -}}
      <h1>文章列表 ：{{- . -}}</h1>
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
            需要 {{ .ReadingTime }} 分钟阅读
          </span>
          <div class="post-preview">
            {{ .Summary | plainify | truncate 200 }}
          </div>
        </li>
      {{ end }}
    </ul>
    {{ partial "pagination.html" $ }}
  </article>
{{ end }}

```

single.html
```html
{{ define "main" }}
  <article class="post">
    <header class="post-header">
      <h1 class="post-title">{{ .Title }}</h1>
      {{- if ne .Type "page" }}
      <div class="post-meta">
        <div>
          {{ partial "icon.html" (dict "ctx" $ "name" "calendar") }}
          {{ .PublishDate.Format "Jan 2, 2006" }}
        </div>
        <div>
          {{ partial "icon.html" (dict "ctx" $ "name" "clock") }}
          需要 {{ .ReadingTime }} 分钟阅读
        </div>
        {{- with .Params.tags }}
        <div>
          {{ partial "icon.html" (dict "ctx" $ "name" "tag") }}
          {{- range . -}}
            {{ with $.Site.GetPage (printf "/%s/%s" "tags" . ) }}
              <a class="tag" href="{{ .Permalink }}">{{ .Title }}</a>
            {{- end }}
          {{- end }}
        </div>
        {{- end }}
      </div>
      {{- end }}
    </header>
    <div class="post-content">
      {{ .Content }}
    </div>
    <div class="post-footer">
      {{ template "_internal/disqus.html" . }}
    </div>
  </article>
{{ end }}

```
baseof.html
```html
<!doctype html>
<html lang="{{ .Site.LanguageCode | default "en-us" }}">
  <head>
    <title>{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} // {{ .Site.Title }}{{ end }}</title>
    <link rel="shortcut icon" href="{{ .Site.Params.favicon | default "/favicon.ico" }}" />
    <meta charset="utf-8" />
    {{ hugo.Generator }}
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="author" content="{{ .Site.Params.author | default "John Doe" }}" />
    <meta name="description" content="{{ if .IsHome }}{{ .Site.Params.description }}{{ else }}{{ .Description }}{{ end }}" />
    {{ $style := resources.Get "css/main.scss" | resources.ExecuteAsTemplate "css/main.scss" . | css.Sass | resources.Minify | resources.Fingerprint -}}
    <link rel="stylesheet" href="{{ $style.RelPermalink }}" />
    {{ with .OutputFormats.Get "rss" -}}
    {{ printf `<link rel=%q type=%q href=%q title=%q>` .Rel .MediaType.Type .Permalink site.Title | safeHTML }}
    {{ end }}
    {{ template "_internal/google_analytics.html" . }}
    {{ template "_internal/twitter_cards.html" . }}
    {{ template "_internal/opengraph.html" . }}
  </head>
  <body>
    <header class="app-header">
      <a href="{{ .Site.BaseURL }}"><img class="app-header-avatar" src="{{ .Site.Params.avatar | default "avatar.jpg" | relURL }}" alt="{{ .Site.Params.author | default "John Doe" }}" /></a>
      <span class="app-header-title">{{ .Site.Title }}</span>
      {{- with .Site.Menus.main }}
      <nav class="app-header-menu">
        {{- range $key, $item := . }}
          {{- if ne $key 0 }}
            {{ $.Site.Params.menu_item_separator | default " - " | safeHTML }}
          {{ end }}
          <a class="app-header-menu-item" href="{{ $item.URL }}">{{ $item.Name }}</a>
        {{- end }}
      </nav>
      {{- end }}
      <p>{{ .Site.Params.description | default "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vehicula turpis sit amet elit pretium." }}</p>

      <!-- 新增栏目开始 
      <div class="categories-section">
        <h3>Categories</h3>
        <ul class="categories-list">
          {{ range .Site.Taxonomies.categories }}
            <li><a href="{{ .Page.Permalink }}">{{ .Page.Title }}</a></li>
          {{ end }}
        </ul>
      </div>
      -->

      <div class="custom-divider">
      contact me ↓
      {{- with .Site.Params.social }}
      <div class="app-header-social">
        {{ range . }}
          <a href="{{ .url }}" target="_blank" rel="noreferrer noopener me">
            {{ partial "icon.html" (dict "ctx" $ "name" .icon "title" .name) }}
          </a>
        {{ end }}
      </div>
      {{- end }}
    </header>
    <main class="app-container">
      {{ block "main" . }}
        {{ .Content }}
      {{ end }}
      <p style="text-align: center;">Copyright 2014 - 2024 lamaper. All Rights Reserved</p>
    </main>
  </body>
</html>
```

assets\css\main.scss
```css
$darkest-color: {{ .Site.Params.style.darkestColor | default "#242930" }};
$dark-color: {{ .Site.Params.style.darkColor | default "#353b43" }};
$light-color: {{ .Site.Params.style.lightColor | default "#afbac4" }};
$lightest-color: {{ .Site.Params.style.lightestColor | default "#ffffff" }};
$primary-color: {{ .Site.Params.style.primaryColor | default "#57cc8a" }};

@import 'base';

@import 'components/app';
@import 'components/error_404';
@import 'components/icon';
@import 'components/pagination';
@import 'components/post';
@import 'components/posts_list';
@import 'components/tag';
@import 'components/tags_list';

// The last 'extra' import can optionally be overridden on a per project
// basis by creating a <HUGO_PROJECT>/assets/css/_extra.scss file.
@import 'extra';

$primary-color: #333;


body {
    font-family: Arial, sans-serif;
 //   color: $primary-color;
  }
  
  .custom-divider {
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, #666, #333);
    margin: 20px 0;
  }
  
  .categories-archive {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .category-card {
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    width: 250px;
  }
  
  .category-title {
    font-size: 18px;
    font-weight: bold;
    text-decoration: none;
    color: #333;
    display: block;
    margin-bottom: 10px;
  }
  .category-title:hover { 
    color: #666; /* 修改为灰色 */ 
    }
  
  .category-posts {
    list-style-type: none;
    padding: 0;
  }
  
  .category-posts li {
    margin: 5px 0;
  }
  
  .category-posts li a {
    text-decoration: none;
    color: #666;
  }
  
  .category-posts li a:hover {
    text-decoration: underline;
  }
  
  .post-preview {
      margin-top: 10px;
      color: #fff;
      font-size: 14px;
      line-height: 1.5;
    }
```
### 本地server显示不了文章的问题

导致这个问题主要是因为我对hugo的认识不够清楚，在写博客的时候不知道从哪抄了一个头标记就用上了，实际上是因为在本地使用`hugo -D`会生成带有draft（草稿）的博客，而`hugo server`不会包含带有draft标记的博客。

恰好，我抄的那个头标记中写了`draft = true`，如此就产生了我的困惑。

感谢[littflower](https://blog.littflower.top)提供了解决思路。