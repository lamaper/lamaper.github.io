+++
date = '2022-06-25T22:42:00+08:00'
draft = false
title = '远古OI笔记'
tags = ['blogs', 'OI', 'algorithm']
categories = ['blogs']
+++
原文地址[一些远古笔记 - lamaper - 博客园](https://www.cnblogs.com/lamaper/articles/16412640.html)
# Dijkstar

```
namespace dij{
    struct edge{
        int to,len,nxt;
        }edge[MAXN];
    bool vis[MAXN];
    long long dist[MAXN];
    int head[MAXN],cnt;
    priority_queue<pair<int,int>,vector<pair<int,int> >,greater<pair<int,int> > >q;

    void add(int x,int y,int z){
        cnt++;
        edge[cnt].to = y;
        edge[cnt].len = z;
        edge[cnt].nxt = head[x];
        head[x] = cnt;
        }

    void work(int e,int f,int g){
            for(int i = 1 ; i <= f ; i++){
            dist[i] = 0x7fffffff;
            }

            dist[g] = 0;
            q.push(make_pair(0,g));
            while(!q.empty()){
                int pos = q.top().second;
               q.pop();
                if (vis[pos]) continue;
               vis[pos] = 1;
                for(int i = head[pos] ; i != 0 ; i = edge[i].nxt){
                    int a = edge[i].to;
                    int b = edge[i].len;
                    if(dist[pos] + b < dist[a]){
                        dist[a] = dist[pos] + b;
                        q.push(make_pair(dist[a],a));
                    }
                }
            }
        }

}
```

# 模板-高精度

耗时两天学习研究；\ 十分感谢B站提供的课程；

```cpp
#include<bits/stdc++.h>
using namespace std;
//高精度
// GJQ
const int MAXN=508;
char ch1[MAXN],ch2[MAXN],temp[MAXN];//temp用于减法交换减数 
int a[MAXN],b[MAXN],c[MAXN];
void add(char c1[],char c2[]){
    //读入两个字符串 
    int len1 = strlen(c1);
    for(int i = 0;i < len1;i++){
        a[i] = c1[len1-i-1] - '0';
        //cout<<a[i]<<" ";
    }
    int len2 = strlen(c2);
    for(int i = 0;i < len2;i++){
        b[i] = c2[len2-i-1] - '0';
        //cout<<b[i]<<" ";
    }

    //加法模拟 
    int len = max(len1 , len2) + 1;
    int jw = 0;
    for(int i = 0;i < len;i++){
        c[i] = a[i] + b[i] + jw;
        jw = c[i]/10;
        c[i] = c[i]%10;
        //cout<<c[i]<<" ";
    }

    for(int i = len - 1 ;i >= 0 ;i--){
        if(0 == c[i] && len > 1){
            len--;
            //cout<<a[i]<<" ";
        }else{
            break;
        }
    }
//  cout<<c[1];
    for(int i = len - 1; i >= 0 ; i--){
        cout<<c[i];
    }
}
void mius(char c1[],char c2[]){ 
    int len1 = strlen(c1);
    int len2 = strlen(c2);

    if(len2 > len1 || (len2 == len1 && strcmp(c1,c2)<0)){
        /*
        * 函数strcmp来自cstring包
        * 这个函数用于比较两个字符串值的大小 
        */
        cout<<"-";
        strcpy(temp,c1);
        strcpy(c1,c2);
        strcpy(c2,temp);
        /*
        * 函数strcpy用于复制字符串内容 
        */
        int len1 = strlen(c1);
        int len2 = strlen(c2);
        //重新读入长度 
    }

    for(int i = 0;i < len1;i++){
        a[i] = c1[len1-i-1] - '0';
        //cout<<a[i]<<" ";
    }
    for(int i = 0;i < len2;i++){
        b[i] = c2[len2-i-1] - '0';
        //cout<<b[i]<<" ";
    }

    //int len = max(len1 , len2) + 1;
    //int jw = 0;

    //len1已经检查过，是最大数长度 
    for(int i = 0;i < len1;i++){
        if(a[i] < b[i]){
            a[i+1] = a[i+1] - 1;
            a[i] = a[i] + 10;
        }
        c[i] = a[i] - b[i];
    }

    //去除前导0 
    for(int i = len1 - 1 ;i >= 0 ;i--){
        if(0 == c[i] && len1 > 1){
            len1--;
            //cout<<a[i]<<" ";
        }else{
            break;
        }
    }
//  cout<<c[1];
    for(int i = len1 - 1; i >= 0 ; i--){
        cout<<c[i];
    }
}
void x(char c1[],char c2[]){
    //读入两个字符串 
    bool flaga = 0;
    if(c1[0] == '-'){
        flaga = 1;
        strcpy(c1,&c1[1]);//删除负号 
    }
    bool flagb = 0;
    if(c2[0] == '-'){
        flagb = 1;
        strcpy(c2,&c2[1]);//删除负号 
    }

    if(flaga != flagb)cout << "-";

    int len1 = strlen(c1);
    for(int i = 0;i < len1;i++){
        a[i] = c1[len1-i-1] - '0';
        //cout<<a[i]<<" ";
    }
    int len2 = strlen(c2);
    for(int i = 0;i < len2;i++){
        b[i] = c2[len2-i-1] - '0';
        //cout<<b[i]<<" ";
    }

    //乘法模拟 
    int jw;
    for(int i = 0;i < len1;i++){
        jw = 0;
        for(int j = 0 ; j < len2 ; j++){
            c[i+j] = a[i] * b[j] + jw + c[i+j];
            jw = c[i+j]/10;
            c[i+j] = c[i+j]%10; 

        }
        c[i+len2] = jw;
    }
    int lenc = len1 + len2;
    for(int i = lenc - 1 ;i >= 0 ;i--){
        if(0 == c[i] && lenc > 1){
            lenc--;
            //cout<<a[i]<<" ";
        }else{
            break;
        }
    }
//  cout<<c[1];
    for(int i = lenc - 1; i >= 0 ; i--){
        cout<<c[i];
    }
}

void chu(char c1[],char c2[]){

    //读入两个字符串 
    bool flaga = 0;
    if(c1[0] == '-'){
        flaga = 1;
        strcpy(c1,&c1[1]);//删除负号 
    }
    bool flagb = 0;
    if(c2[0] == '-'){
        flagb = 1;
        strcpy(c2,&c2[1]);//删除负号 
    }

    if(flaga != flagb)cout << "-";

    int len1 = strlen(c1);
    for(int i = 0;i < len1;i++){
        a[i] = c1[len1-i-1] - '0';
        //cout<<a[i]<<" ";
    }
    int len2 = strlen(c2);
    for(int i = 0;i < len2;i++){
        b[i] = c2[len2-i-1] - '0';
        //cout<<b[i]<<" ";
    }

    //乘法模拟 
    int jw;
    for(int i = 0;i < len1;i++){
        jw = 0;
        for(int j = 0 ; j < len2 ; j++){
            c[i+j] = a[i] * b[j] + jw + c[i+j];
            jw = c[i+j]/10;
            c[i+j] = c[i+j]%10; 

        }
        c[i+len2] = jw;
    }
    int lenc = len1 + len2;
    for(int i = lenc - 1 ;i >= 0 ;i--){
        if(0 == c[i] && lenc > 1){
            lenc--;
            //cout<<a[i]<<" ";
        }else{
            break;
        }
    }
//  cout<<c[1];
    for(int i = lenc - 1; i >= 0 ; i--){
        cout<<c[i];
    }
}
int main(){
    cin >> ch1 >> ch2 ;
    x(ch1,ch2); 
    return 0;
}
```

# 欧拉筛

```今日学习-欧拉筛
#include <cstring>
 using namespace std;
 int prime[1100000],primesize,phi[11000000];
 bool isprime[11000000];
 void getlist(int listsize)
 {
     memset(isprime,1,sizeof(isprime));
     isprime[1]=false;
     for(int i=2;i<=listsize;i++)
     {
         if(isprime[i])prime[++primesize]=i;
         for(int j=1;j<=primesize&&i*prime[j]<=listsize;j++)
          {
             isprime[i*prime[j]]=false;
            if(i%prime[j]==0)break;
         }
    }
 }
```

# 广度优先搜索

## 关于队列

queue<> X;//创建队列\ X.pop();//弹出队首\ X.push();//放入元素\ X.empty();//return bool\ X.front();//返回队首元素\ X.size();//队列大小\

## P1443马的遍历

```cpp
#include <bits/stdc++.h>
using namespace std;

struct node{
    int x, y, t;    
};

queue<node> q;

int m,n,sx,sy;
int ans[401][401];
int dir[][2] = {{1,2},{1,-2},{2,1},{2,-1},{-1,2},{-1,-2},{-2,1},{-2,-1}};
bool vis[401][401];

void bfs(int sx,int sy){
    q.push((node){sx,sy,0});

    vis[sx][sy] = 1;
    ans[sx][sy] = 0;

    while(!q.empty()){
        node now = q.front();
        q.pop();

        for(int i = 0 ;i < 8;i++){
            int nx = now.x + dir[i][0];
            int ny = now.y + dir[i][1];

            if(vis[nx][ny] || nx < 1||ny < 1||nx > n||ny > m)continue;

            vis[nx][ny] = 1;
            ans[nx][ny] = ans[now.x][now.y] + 1;
            q.push( (node){nx , ny , now.t+1} );

        }

    }

}

int main(){
    cin >> n >> m >> sx >> sy;

    bfs(sx,sy);

    for(int i = 1 ; i <= n ; i++){
        for(int j = 1 ; j <= m ; j++){
            if(vis[i][j])printf("%-5d",ans[i][j]);
            else cout << "-1   ";
        }cout<<endl;

    }

    return 0;
}
```

## P1135奇怪的电梯

```cpp
#include<bits/stdc++.h>
using namespace std;
const int MAXN = 100005;
struct node{
    int st,t;
};
const int c[2] = {1,-1};
int k[MAXN];
int n,a,b,ans;
bool vis[MAXN];

queue<node> q;

void bfs(int a){
    q.push((node){a , 0});
    vis[a] = 1;
    ans = -1;

    while(!q.empty()){
        node now = q.front();
        q.pop();

        //for(int j = 0 ; j < n ; j++){
            for(int i = 0 ; i < 2 ; i++){
                int n = now.st + k[now.st]*c[i];

                if(n < 1 || n > b || vis[n])continue;

                vis[n] = 1;
                if(n == b)
                {
                        ans = now.t + 1;
                        break;
                    }
                q.push((node){ n , now.t + 1});
            }

        //}

    }

}

int main(){

    cin >> n >> a >> b;
    if(a == b){
    cout << "0";
    return 0;}
    for(int i = 1 ; i <= n ; i++)cin >> k[i];

    bfs(a);

    cout << ans;

    return 0;
}
```