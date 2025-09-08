+++
date = '2025-02-27T23:30:42+08:00'
draft = false
title = '一些神奇的C语言题目（1）'
tags = ['coding', 'algorithm', 'C/C++']
categories = ['coding']
+++

今天做了做2024年春季学期的C语言期末题目，恐怖如斯。OI退役已经两年多，很多代码脑子里面有想法，就是写不出来，尤其是C++转向C后，用不了STL，实在是有点不知所措。这个第二题，一眼顶针鉴定为字典树，但实际上它的数据量很小，如果用map会很快解决，但是没有如果，这里用不了map，我只能苦逼的写字典树。

(题目)[https://lexue.bit.edu.cn/mod/programming/view.php?id=484192]

输入一篇文章，以空行结束，希望统计一下其中单词出现的次数。

所谓“单词”，是仅由大写字母和/或小写字母组成的连续子串，且不区分大小写。例如，about是一个单词，a_out会被认为是a和out两个单词，about和About会被认为是同一个单词。

输出时，每个不同的单词输出一行，包括单词（全小写）和出现次数，以空格分隔。优先输出出现次数多的单词；出现次数相同的，按字典序输出。

数据范围
文章中，每个单词不超过20个字符，每行不超过80个字符，有效行数不超过100行。

 

```c
#include <stdio.h>
#include <ctype.h>
#include <stdlib.h>
#include <string.h>

#define MAX_WORD_LEN 20
#define MAX_LINE_LEN 80
#define MAX_WORD_COUNT 1000

#define lamaper 0

typedef struct TrieNode {
    struct TrieNode* children[26];//有26个子节点，对应26个字母
    int count; //一般为0，如果不为零就代表到这里截至有单词出现，那么这里的数字就是单词出现的次数
} TrieNode;

TrieNode* create_node() {
    TrieNode* node = (TrieNode*)malloc(sizeof(TrieNode));//神奇的初始化，没有面向对象就少了很多爽点
    for(int i = 0; i < 26; i++){
        node->children[i] = NULL;
    }
    node->count = 0;
    return node;
}

TrieNode* insert_char(TrieNode* current, char c) {
    if('a' <= c && c <= 'z'){//按照题目要求进行大小写切换
        int index = c - 'a';//把字母变成数字索引
        if(current->children[index] == NULL){
            current->children[index] = create_node();
        }
        return current->children[index];
    }else if ('A' <= c && c <= 'Z'){
        int index = tolower(c) - 'a';
        if (current->children[index] == NULL) {
            current->children[index] = create_node();
        }
        return current->children[index];
    }
    return NULL;
}

typedef struct WordCount{//这个用来统计词语
    char word[MAX_WORD_LEN + 1];
    int count;
}WordCount;

WordCount word_list[MAX_WORD_COUNT]; 
int word_count = 0;

void dfs(TrieNode* node, char* prefix, int len){//简单的树的前序遍历
    if(node->count > 0){//如果这里被截断了
        strncpy(word_list[word_count].word, prefix, len);//把prefix复制到word_list[word_count].word中
        word_list[word_count].word[len] = '\0';//补加一个截断，养成好习惯
        word_list[word_count].count = node->count;
        word_count++;
    }

    for(int i = 0; i < 26; i++){
        if(node->children[i] != NULL){
            prefix[len] = 'a' + i;//把字母加到prefix里面
            prefix[len + 1] = '\0';
            dfs(node->children[i], prefix, len + 1);//len既可以理解为长度也可以理解为搜索的深度
        }
    }
}

int compare(const void* a, const void* b){//这个是专门给qsort排序用的，qsort类似于STL的sort
    WordCount* w1 = (WordCount*)a;
    WordCount* w2 = (WordCount*)b;
    if(w1->count != w2->count){
        return w2->count - w1->count; // 出现次数多的排在前面
    }else{
        return strcmp(w1->word, w2->word); 
        //strcmp 是 C 标准库中的一个字符串比较函数，用于按字典顺序比较两个字符串
    }
}

signed main(){
    TrieNode* root = create_node();
    TrieNode* current = root;

    char line[MAX_LINE_LEN + 1]; 

    while(fgets(line, sizeof(line), stdin) != NULL){
        int len = strlen(line);
        if(len == 1 && line[0] == '\n'){ 
            break;
        }
        for(int i = 0; i < len; i++){
            char c = line[i];
            if(isalpha(c)){ //如果是字母
                current = insert_char(current, c);
            }else{ //不是就退回根节点
                if(current != root){ 
                    current->count++;
                }
                current = root; 
            }
        }
    }

    if(current != root){
        current->count++;
    }

    char prefix[MAX_WORD_LEN + 1];
    prefix[0] = '\0';
    dfs(root, prefix, 0);

    qsort(word_list, word_count, sizeof(WordCount), compare);

    for(int i = 0; i < word_count; i++){
        printf("%s %d\n", word_list[i].word, word_list[i].count);
    }


    return lamaper;//防伪
}
```
