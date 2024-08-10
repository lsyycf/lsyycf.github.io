---
layout: post
title: "Manacher算法"
date:   2024-8-10
tags: [算法竞赛,字符串]
comments: true
author: lsyycf
---
采用动态规划方法，用于求解一个字符串中的最长回文子串
<!-- more -->
```
#include <bits/stdc++.h>
#define io cin.tie(0), cout.tie(0), ios::sync_with_stdio(false)
#define LL long long
#define ULL unsigned long long
#define EPS 1e-8
#define INF 0x7fffffff
#define SUB 0x80000000
using namespace std;
const int N = 1000002;
int n, P[N << 1];
char a[N], S[N << 1];
void change()
{
    S[0] = '$', S[1] = '#';
    int k = 2;
    for (int i = 0; i < n; i++)
    {
        S[k++] = a[i];
        S[k++] = '#';
    }
    S[k++] = '&';
    n = k;
}
void manacher()
{
    int R = 0, C;
    for (int i = 1; i < n; i++)
    {
        if (i < R)
            P[i] = min(P[(C << 1) - i], P[C] + C - i);
        else
            P[i] = 1;
        while (S[i + P[i]] == S[i - P[i]])
            P[i]++;
        if (P[i] + i > R)
        {
            R = P[i] + i;
            C = i;
        }
    }
}
int main()
{
    io;
    scanf("%s", a);
    n = strlen(a);
    change();
    manacher();
    int ans = 1;
    for (int i = 0; i < n; i++)
        ans = max(ans, P[i]);
    printf("%d", ans - 1);
    return 0;
}
```

