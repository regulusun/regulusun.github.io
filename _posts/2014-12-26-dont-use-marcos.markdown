---
layout: post
title: "不要使用Marco来定义常量"
categories: travel
---

通常，自定义界面的时候，会需要定义很多诸如高度、宽度、item spacing等常量。

刚学Objective C的时候，我习惯使用下面这种方式来定义常量：

    #define MyViewHeight = 200;


对常量进行定义，而不是在代码中使用magic number是一个好习惯，但是使用上面这种Marco的方式来定义常量，我发现至少存在下列问题：

1. 没有声明变量类型
1. 没有限定常量范围

所以最好使用下面这种方式来声明常量：
    
    static const CGFloat myViewHeight = 200;

> Because it respects scope and is type-safe.

参考：
[“static const” vs “#define” in C](http://stackoverflow.com/questions/1674032/static-const-vs-define-in-c)
