---
title: Rust学习笔记
description: 刚上大学初生牛犊不怕虎，现在被这门克苏鲁语言吓得不敢再碰了...
author: lamaper
date: 2024-10-24 20:41:42 +0800
categories: [Coding]
tags: [coding, rust]
math: true
mermaid: true
---
### String和&str

在rustlings的练习题中见到了一些判断类型的题：

```rust
fn main() {
    string_slice("blue");

    string("red".to_string());

    string(String::from("hi"));

    string("rust is fun!".to_owned());

    string_slice("nice weather".into());

    string(format!("Interpolation {}", "Station"));

    // WARNING: This is byte indexing, not character indexing.
    // Character indexing can be done using `s.chars().nth(INDEX)`.
    string_slice(&String::from("abc")[0..1]);

    string_slice("  hello there ".trim());

    string("Happy Monday!".replace("Mon", "Tues"));

    string("mY sHiFt KeY iS sTiCkY".to_lowercase());
}
```

一个&str类型的字符串可以通过`.to_string()`进行转换。

如果需要删除一个字符串中的空格键，可以使用`.trim()`。

如果需要在一个字符串（String）后面加上一个新的字符串，可以有如下操作：

```rust
fn compose_me(input: &str) -> String {
    // TODO: Add " world!" to the string! There are multiple ways to do this.
    return input.to_string() +  " world!";
}
```

其实对于这段代码我是有点疑惑的，因为在前面的认知中，单独的双引号应当是字符串切片，而不是字符串，但是这里显然，一个String与一个字符串切片的连接，是一个String，而不是一个&str，有点意思。

当然，这个实现方法有很多，比如使用格式化字符串：

```rust
format!("{} world!",input);
```

### 枚举（enum）

rust的枚举十分强大，可以自带附加属性，这个不好拿语言描述，看下例子即可：

```rust
enum Message {
    // TODO: Implement the message variant types based on their usage below.
    Resize {width: u64, height: u64},
    Move(Point),
    Echo(String),
    ChangeColor(u8, u8, u8),
    Quit,
}
```

对于一个枚举，还有一个很好用的`match`语句来进行匹配：

```rust
fn process(&mut self, message: Message) {
        // TODO: Create a match expression to process the different message
        // variants using the methods defined above.
        match message {
            Message::Resize {width, height} => self.resize(width, height),
            Message::Move(point) => self.move_position(point),
            Message::Echo(s) => self.echo(s),
            Message::ChangeColor(red, green, blue) => self.change_color(red, green, blue),
            Message::Quit => self.quit(),
        }
    }
```

和switch-case有异曲同工之妙，但比其更加强大。

