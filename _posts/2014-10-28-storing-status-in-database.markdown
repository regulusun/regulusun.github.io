---
layout: post
title:  "使用二进制表示状态"
date: 2014-10-28 23:10
categories: coding
---
今天看到下面这样的java代码：
{% highlight java %}
static final int LOGICAL_DELETION = 1 << 0
{% endhighlight %}

这里定义了一个全局变量LOGICAL_DELETION，用来标记记录的逻辑删除。

<< 是二进制左移位运算符。譬如1 << 1，在8位(8 bits)二进制中表示即是：

```
1表示：00000001
1 << 1运算后得到: 00000010
```

使用二进制算法来计算一个储存为int的常量，有什么作用呢？

我平时习惯使用int整形表示状态值。

假如要表示一些数据的状态，则创建变量并赋值为int类型：

{% highlight objective-c %}
typedef NS_ENUM(NSInteger, UITableViewCellStyle) {
    UITableViewCellStyleDefault = 0,
    UITableViewCellStyle1 = 1,
    UITableViewCellStyle2 = 2,
    UITableViewCellStyle3 = 3
};
{% endhighlight objective-c %}

但是采取像上面这样的int类型来记录状态，如果要表示同时具备UITableViewCellStyle1和UITableViewCellStyle2的状态，就需要写下面这样的判断：

```
(style == UITableViewCellStyle1 || style == UITableViewCellStyle2 )
```

如果使用二进制表示状态，上面的代码可以写成：

{% highlight objective-c %}
typedef NS_ENUM(NSInteger, UITableViewCellStyle) {
    UITableViewCellStyleDefault = 0, // 00000000
    UITableViewCellStyle1 = 1 << 0,  // 00000001
    UITableViewCellStyle2 = 1 << 1,  // 00000010
    UITableViewCellStyle3 = 1 << 2   // 00000100
};
{% endhighlight objective-c %}

使用 << 移位预算符计算后，每一个状态在二进制运算中代表一位。

这时候，如果要表示UITableViewCellStyle1及UITableViewCellStyle2，则可使用|(OR)运算符，表示为00000011。而检查style = 00000001 是否在上述两种状态中，则可以使用&(AND)运算符来做判断：

```
00000001 (style)
00000011 (UITableViewCellStyle1及UITableViewCellStyle2)
-------- (&)
00000001 (result)
```

如果result != 0的话，style就存在上述状态中，如果result == 0，则style不存在上述状态中。

使用这种方法，就不需要像上面使用int整型表示状态时，写两个逻辑判断。

那么最多可以表示多少个状态呢？因为每个位数表示一种状态，最大可以表示int整型位数个数的状态，如int 8位即可表示8种状态，int 16位则可表示16种状态。

参考资料：

1. [The Binary System](http://www.math.grin.edu/~rebelsky/Courses/152/97F/Readings/student-binary#1011-a)
2. [The Beginner's Guide to Using Enum Flags](http://www.codeproject.com/Articles/13740/The-Beginner-s-Guide-to-Using-Enum-Flags)
3. [Stackoverflow: How to use enums as flags in C++?](http://stackoverflow.com/questions/1448396/how-to-use-enums-as-flags-in-c)
