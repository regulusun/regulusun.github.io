---
layout: post
title: "不要使用macro来定义常量"
categories: coding ios
---

通常，自定义界面的时候，会需要定义很多诸如高度、宽度、item spacing等常量。

<!--more-->

刚学Objective C的时候，我习惯使用下面这种方式来定义常量：

    #define MyViewHeight = 200;


对常量进行定义，而不是在代码中使用magic number是一个好习惯，但是使用上面这种macro的方式来定义常量，我发现至少存在下列问题：

1. 没有声明变量类型
1. 没有限定常量范围
1. 在xcode里面macro的屎黄色很难看

所以最好使用下面这种方式来声明常量：
    
    static const CGFloat myViewHeight = 200;

> Because it respects scope and is type-safe.

仔细看一下这里用到两个C keyword：

static: 
>
> 1. A static variable inside a function keeps its value between invocations.
> 2. A static global variable or a function is "seen" only in the file it's declared in

const: 
> The compiler won't allow something declared as const to be modified.

从上面解释可以看出，static实现了scoping, const保证了常量不能被修改（编译器校验），而CGFloat的类型定义保证了type-safe。

另外语法高亮也比xcode屎黄色的macro代码好看。



参考资料：

1. [“static const” vs “#define” in C](http://stackoverflow.com/questions/1674032/static-const-vs-define-in-c)
1. [What does “static” mean in a C program?](http://stackoverflow.com/questions/572547/what-does-static-mean-in-a-c-program)
1. [Does “const” just mean read-only or something more? ](http://stackoverflow.com/questions/4486326/does-const-just-mean-read-only-or-something-more-in-c-c)

