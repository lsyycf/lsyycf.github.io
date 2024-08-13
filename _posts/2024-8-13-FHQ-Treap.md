---
layout: post
title: "FHQ-Treap"
date:   2024-8-13
tags: [算法竞赛,高级数据结构]
comments: true
author: lsyycf

---

通过对树的分裂和合并，更简单地维护树的平衡
<!-- more -->

```
#include <bits/stdc++.h>
#define io cin.tie(0), cout.tie(0), ios::sync_with_stdio(false)
#define LL long long
#define ULL unsigned long long
#define EPS 1e-8
#define INF 0x7fffffff
#define SUB -INF - 1
using namespace std;
const int M = 1000010;
int cnt = 0, root = 0;
struct Node
{
    int ls, rs;
    int key, pri;
    int size;
} t[M];
void newNode(int x)
{
    cnt++;
    t[cnt].size = 1;
    t[cnt].ls = t[cnt].rs = 0;
    t[cnt].key = x;
    t[cnt].pri = rand();
}
void update(int u)
{
    t[u].size = t[t[u].ls].size + t[t[u].rs].size + 1;
}
void Split(int u, int x, int &l, int &r)
{
    if (u == 0)
    {
        l = r = 0;
        return;
    }
    if (t[u].key <= x)
    {
        l = u;
        Split(t[u].rs, x, t[u].rs, r);
    }
    else
    {
        r = u;
        Split(t[u].ls, x, l, t[u].ls);
    }
    update(u);
}
int Merge(int l, int r)
{
    if (l == 0 || r == 0)
        return l + r;
    if (t[l].pri > t[r].pri)
    {
        t[l].rs = Merge(t[l].rs, r);
        update(l);
        return l;
    }
    else
    {
        t[r].ls = Merge(l, t[r].ls);
        update(r);
        return r;
    }
}
void Insert(int x)
{
    int l, r;
    Split(root, x, l, r);
    newNode(x);
    int aa = Merge(l, cnt);
    root = Merge(aa, r);
}
void Del(int x)
{
    int l, r, p;
    Split(root, x, l, r);
    Split(l, x - 1, l, p);
    p = Merge(t[p].ls, t[p].rs);
    root = Merge(Merge(l, p), r);
}
void Rank(int x)
{
    int l, r;
    Split(root, x - 1, l, r);
    printf("%d\n", t[l].size + 1);
    root = Merge(l, r);
}
int kth(int u, int k)
{
    if (k == t[t[u].ls].size + 1)
        return u;
    if (k <= t[t[u].ls].size)
        return kth(t[u].ls, k);
    if (k > t[t[u].ls].size)
        return kth(t[u].rs, k - t[t[u].ls].size - 1);
    return 0;
}
void Precursor(int x)
{
    int l, r;
    Split(root, x - 1, l, r);
    printf("%d\n", t[kth(l, t[l].size)].key);
    root = Merge(l, r);
}
void Successor(int x)
{
    int l, r;
    Split(root, x, l, r);
    printf("%d\n", t[kth(r, 1)].key);
    root = Merge(l, r);
}
int main()
{
    srand(time(NULL));
    int n;
    cin >> n;
    while (n--)
    {
        int opt, x;
        cin >> opt >> x;
        switch (opt)
        {
        case 1:
            Insert(x);
            break;
        case 2:
            Del(x);
            break;
        case 3:
            Rank(x);
            break;
        case 4:
            printf("%d\n", t[kth(root, x)].key);
            break;
        case 5:
            Precursor(x);
            break;
        case 6:
            Successor(x);
            break;
        }
    }
    return 0;
}
```

